""" 
Generate Q-guide summary for all the courses in the database (populate q_guide_summary column in courses.json) 
- Using sentiment analysis due to token limit of OpenAI API 

"""

import os 
import json 
import time 
import argparse
import openai 
from dotenv import load_dotenv 
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import Counter 
import re 
import nltk 
from nltk.tokenize import sent_tokenize 
from nltk.corpus import stopwords
from tqdm import tqdm

# Load environment variables 
load_dotenv()

# OpenAI API key 
openai.api_key = os.getenv("OPENAI_API_KEY")

def download_nltk_resources(): 
    """
    Download necessary NLTK resources for tokenization and stop words if not already present.
    """
    try: 
        nltk.data.find("tokenizers/punkt")
    except LookupError: 
        nltk.download("punkt")
    try: 
        nltk.data.find("corpora/stopwords")
    except LookupError: 
        nltk.download("stopwords")


def analyze_comments(comments: List[str]) -> Dict[str, Any]: 
    """ 
    Analyze comments to extract key themes, sentiment, and representative examples. 
    
    Args: 
        comments: List of student comments 
    
    Returns: 
        Dictionary with analysis results
    """ 

    if not comments: 
        return {
            "themes": [], 
            "sentiment": "neutral", 
            "positive_examples": [], 
            "negative_examples": [], 
            "summary": "No student comments available for this course"
        }
        
    # Sentiment analysis 
    positive_words = ["great", "excellent", "good", "best", "amazing", "helpful", "enjoyed", "love", 
                      "interesting", "engaging", "clear", "recommend", "fantastic", "awesome", "this is a gem", "loved", "goated"]
    negative_words = ["difficult", "hard", "boring", "confusing", "unclear", "challenging", "tough", 
                      "disappointed", "waste", "terrible", "awful", "useless", "frustrating", "bad", "poor", "terrible", "worse"]
    
    # Count the sentiment words
    positive_count = 0
    negative_count = 0 

    # Extract key themes using word frequency 
    all_text = " ".join(comments).lower()
    words = re.findall(r'\b\w+\b', all_text)
    stop_words = set(stopwords.words('english'))
    filtered_words = [word for word in words if word not in stop_words]

    # Count word frequencies 
    word_counts = Counter(filtered_words)
    
    # Identify themes (most common non-stop words)
    themes = [word for word, count in word_counts.most_common(10)]

    # Categorize comments by sentiment 
    positive_comments = []
    negative_comments = []
    neutral_comments = []

    for comment in comments: 
        comment_lower = comment.lower()
        pos_score = sum(comment_lower.count(word) for word in positive_words)
        neg_score = sum(comment_lower.count(word) for word in negative_words)
        
        positive_count += pos_score
        negative_count += neg_score
        
        if pos_score > neg_score: 
            positive_comments.append(comment)
        elif neg_score > pos_score: 
            negative_comments.append(comment)
        else: 
            neutral_comments.append(comment)
        
    # Determine overall sentiment 
    if positive_count > negative_count * 1.5: 
        sentiment = "very positive"
    elif positive_count > negative_count: 
        sentiment = "positive"  
    elif negative_count > positive_count * 1.5: 
        sentiment = "very negative"
    elif negative_count > positive_count: 
        sentiment = "negative"
    else: 
        sentiment = "Mixed"

    # Select representative examples
    positive_examples = positive_comments[:5] if positive_comments else []
    negative_examples = negative_comments[:5] if negative_comments else []

    comment_summary = f"Analysis of {len(comments)} student comments show {sentiment} sentiment overall."
    
    if themes: 
        comment_summary += f" Key themes include: {', '.join(themes)}"

    comment_summary += f"Positive comments: {len(positive_comments)}, Negative comments: {len(negative_comments)}, Neutral comments: {len(neutral_comments)}"

    return {
        "themes": themes,
        "sentiment": sentiment, 
        "positive_examples": positive_examples, 
        "negative_examples": negative_examples, 
        "summary": comment_summary  
    }

def create_summary_prompt(course: Dict[str, Any]) -> str: 
    """ 
    Create a prompt for q guide comment summary generation. 

    Args:
        course: Course dictionary containing course information. 
    
    Returns:
        str: Prompt for generating a summary for the course. 
    """

    # Extract relevant course information
    course_id = course.get("id", "Unknown Course ID")
    title = course.get("title", "Unknown Course Title")
    professor = course.get("professor", "Unknown Professor")
    description = course.get("description", "Not Available in the database")
    term = course.get("term", "Unknown Term")
    gen_eds = course.get("gen_eds", [])
    gen_eds_text = ", ".join(gen_eds) if gen_eds else "None" 

    # Extract Q-Guide specfic information 
    workload = course.get("workload", "Not Available in the database")
    q_rating = course.get("q_rating", "Not Available in the database")
    comments = course.get("comments", [])

    # Analyze all comments to extract key themes and sentiment 
    comment_analysis = analyze_comments(comments)

    # Create a prompt for Q-guide summary generation 
    prompt = f"""
    Course ID: {course_id}
    Course Title: {title}
    Professor: {professor}
    Description: {description}
    Term: {term}
    Gen Eds: {gen_eds_text}
    Workload: {workload}
    Q Rating: {q_rating}

    COMMENT ANALYSIS:
    Total Comments: {len(comments)}
    Overall Sentiment: {comment_analysis['sentiment']}
    Key Themes: {', '.join(comment_analysis['themes'][:7]) if comment_analysis['themes'] else 'None identified'}

    Comment Summary: {comment_analysis['summary']}

    REPRESENTATIVE POSITIVE COMMENTS:
    {chr(10).join([f"- {comment}" for comment in comment_analysis['positive_examples']])}

    REPRESENTATIVE NEGATIVE COMMENTS:
    {chr(10).join([f"- {comment}" for comment in comment_analysis['negative_examples']])}

    Based on ALL the Q Guide information above, write a concise 3-4 line summary of this course that would appear in a course card.
    Focus on:
    1. The course content and teaching style
    2. Workload and difficulty level
    3. Student sentiment and overall experience
    4. Any distinctive features or considerations

    The summary must accurately represent the full range of student experiences, including both positive and negative aspects.
    Keep the summary under 75 words and make it informative for students deciding whether to take the course. You can use short sentences to fit as much information as possible.
    Write in third person, present tense. Be specific and objective.
    """
    return prompt

def generate_summary(course: Dict[str, Any], model: str = "gpt-3.5-turbo") -> str:
    """
    Generate a Q Guide summary for a course using OpenAI API.
        
    Args:
        course: Dictionary containing course data
        model: OpenAI model to use
            
    Returns:
        Generated summary text
    """

    prompt = create_summary_prompt(course)
    
    # Add retry logic for API rate limits 
    max_retries = 3
    for attempt in range(max_retries):
        try: 
            response = openai.ChatCompletion.create(
                model=model, 
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates balanced and accurate Harvard Q Guide course summaries based on all student feedback."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens= 150, 
                temperature= 0.7
            )

            summary = response.choices[0].message.content.strip()
            return summary 

        except Exception as e: 
            if attempt < max_retries - 1: 
                wait_time = 2 ** attempt # Exponential backoff
                print(f"OpenAI error: {e}. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else: 
                print(f"Failed to generate summary for {course.get('id', 'Unknown')}: {e}")
                return "No Q Guide summary available"

def load_courses(file_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Load course data from a JSON file. 

    Args: 
        file_path: Path to the JSON file 
    
    Returns:
        Dictionary containing course data
    """

    try: 
        with open(file_path, 'r') as f: 
            courses = json.load(f)

        # Handle different JSON structures
        if isinstance(courses, list):
            # Convert list to dictionary with IDs as keys 
            courses_dict = {}
            for course in courses: 
                course_id = course.get('id', course.get('course_id'))
                if course_id:
                    courses_dict[course_id] = course 
            return courses_dict 
        
        elif isinstance(courses, dict): 
            return courses 
        else: 
            raise ValueError("Invalid JSON format: expected list or dictionary")
    except Exception as e: 
        print(f"Error loading courses from {file_path}: {e}")
        return {}


def save_courses(courses: Dict[str, Dict[str, Any]], file_path: str) -> None: 
    """
    Save course data to a JSON file. 

    Args: 
        courses: Dictionary of course data 
        file_path: Path to save the JSON file

    """
    try: 
        # Create directory if it does not exist. 
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Determine original format (list or dict)
        is_list_format = False
        with open(file_path, 'r') as f: 
            try: 
                original_data = json.load(f)
                is_list_format = isinstance(original_data, list)
            except: 
                pass 

        # Save in the appropriate format 
        with open(file_path, 'w') as f: 
            if is_list_format:
                # Convert back to the list format 
                courses_list = list(courses.values())
                json.dump(courses_list, f, indent=2)
            else: 
                # keep dictionary format 
                json.dump(courses, f, indent=2)

        print(f"Saved {len(courses)} courses to {file_path}")
    except Exception as e: 
        print(f"Error saving courses: {e}")
    
def save_summaries_only(summaries: Dict[str, str], file_path: str) -> None: 
    """
    Save only the Q guide summaries to a seperate JSON file. 

    Args: 
        summaries: Dictionary mapping coursing IDs to summaries 
        file_path: Path to save the summaries JSON file
    """ 

    try: 
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, 'w') as f: 
            json.dump(summaries, f, indent=2)

        print(f"Saved {len(summaries)} summaries to {file_path}")

    except Exception as e: 
        print(f"Error saving summaries: {e}")


def process_courses(courses: Dict[str, Dict[str, Any]], model: str= "gpt-3.5-turbo", batch_size: int = 10, force_regenerate: bool = False) -> Dict[str, str]: 
    """
    Process courses to generate Q guide summaries. 

    Args: 
        courses: Dictionary of course data 
        model: OpenAI model to use for summary generation 
        batch_size: Number of courses to process in each batch 
        force_regenerate: Force regenerate summaries even if they exist

    Returns: 
        Dictionary of course IDs to summaries
    """

    summaries = {}
    
    # Get courses that need summaries
    courses_to_process = {}
    for course_id, course in courses.items():
        if force_regenerate or 'q_guide_summary' not in course or not course['q_guide_summary']:
            courses_to_process[course_id] = course
            
    print(f"Processing {len(courses_to_process)} courses (out of {len(courses)} total)")

    # Process courses in batches
    course_ids = list(courses_to_process.keys())
    
    for i in range(0, len(course_ids), batch_size):
        batch_ids = course_ids[i:i+batch_size]
        
        print(f"\nProcessing batch {i//batch_size + 1}/{(len(course_ids)-1)//batch_size + 1}")
        
        for course_id in tqdm(batch_ids):
            course = courses_to_process[course_id]
            
            # Generate summary
            summary = generate_summary(course, model)
            
            # Store summary
            summaries[course_id] = summary
            courses[course_id]['q_guide_summary'] = summary
            
            # Avoid rate limits - sleep between API calls
            time.sleep(0.5)
    
    return summaries

def main():
    # Download NLTK resources if needed
    download_nltk_resources()
    
    parser = argparse.ArgumentParser(description='Generate Q Guide summaries for Harvard courses')
    parser.add_argument('--input', type=str, default='../db/courses.json',
                        help='Path to course data JSON file (default: ../db/courses.json)')
    parser.add_argument('--output', type=str, default=None,
                        help='Path to save updated course data (default: same as input)')
    parser.add_argument('--summaries-output', type=str, default=None,
                        help='Path to save only the summaries (optional)')
    parser.add_argument('--model', type=str, default="gpt-3.5-turbo", 
                        choices=["gpt-3.5-turbo", "gpt-4-turbo"], 
                        help='OpenAI model to use (default: gpt-3.5-turbo)')
    parser.add_argument('--batch-size', type=int, default=10, 
                        help='Number of courses to process in each batch (default: 10)')
    parser.add_argument('--limit', type=int, default=None, 
                        help='Maximum number of courses to process (default: all)')
    parser.add_argument('--force', action='store_true',
                        help='Force regeneration of summaries for all courses')
    
    args = parser.parse_args()
    
    # Set output path to input path if not specified
    if not args.output:
        args.output = args.input
    
    # Load course data
    print(f"Loading course data from {args.input}")
    courses = load_courses(args.input)
    
    if not courses:
        print("No courses found. Exiting.")
        return
    
    print(f"Loaded {len(courses)} courses")
    
    # Limit number of courses if specified
    if args.limit and args.limit < len(courses):
        limited_courses = {}
        for i, (course_id, course) in enumerate(courses.items()):
            if i >= args.limit:
                break
            limited_courses[course_id] = course
        courses = limited_courses
        print(f"Limited to {len(courses)} courses")
    
    # Generate summaries
    print(f"Generating Q Guide summaries using {args.model}")
    summaries = process_courses(courses, args.model, args.batch_size, args.force)
    
    # Save updated course data
    save_courses(courses, args.output)
    
    # Save summaries separately if requested
    if args.summaries_output:
        save_summaries_only(summaries, args.summaries_output)
    
    # Print summary
    print(f"\nGenerated {len(summaries)} Q Guide summaries")
    print("Done!")

if __name__ == "__main__":
    main()        
       

            
                
                
            



    
    
        
    

