import os
import json 
import numpy as np 
import faiss # vector search library 
from dotenv import load_dotenv 
import openai 
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

# Load environment variables 
load_dotenv()

# OpenAI API key 
openai.api_key = os.getenv("OPENAI_API_KEY")

class SemanticSearch: 
    def __init__(self, embedding_dimension: int = 1536, index_path: Optional[str]= None): 
        """
        Initialize the semantic search system

        args: embedding dimensin (156 for OpenAI ada-002)
        index_path: path to pre-built FAISS index file 
    
        """
        self.embedding_dimension = embedding_dimension
        self.course_data = {}
        self.course_ids = []
        self.embeddings = None
        
        # Add caching for better performance
        self.query_cache = {}  # Cache for query embeddings
        self.filter_cache = {}  # Cache for filtered results
        self.cache_size_limit = 100  # Limit cache size to prevent memory issues

        # Initialize FAISS index
        if index_path and os.path.exists(index_path): 
            print(f"Loading FAISS index from {index_path}")
            self.index = faiss.load_index(index_path)
        else: 
            print(f"Creating a new FAISS index with dimension {embedding_dimension}")
            self.index = faiss.IndexFlatIP(self.embedding_dimension)

    def load_course_data(self, data_path: str) -> None: 
        """
        Load course data from the JSON file. 

        Args: 
            data_path: Path to course data JSON file
        """
        
        if not os.path.exists(data_path): 
            print(f"Error: File {data_path} does not exist.")
            return 
        
        # Load course data from JSON file
        with open(data_path, "r") as f: 
            self.course_data = json.load(f)
        
        print(f"Loaded {len(self.course_data)} courses from {data_path}")

        # Extract course IDs to display course cards 
        self.course_ids = list(self.course_data.keys())


    def embed_query(self, query_text: str) -> np.ndarray: 
        """
        Generate embeddings for a query using OpenAI's embedding API 

        Args: 
            query_text: qeury text to embed 

        Returns: 
            Numpy array of embeddings
        """
        
        # Check if we have this query cached
        if query_text in self.query_cache:
            return self.query_cache[query_text]
            
        # Add retry logic for the API rate limits 
        max_retries = 3
        for attempt in range(max_retries): 
            try: 
                response = openai.Embedding.create(input=query_text, model="text-embedding-ada-002")
                embedding = np.array(response["data"][0]["embedding"])
                
                # Cache the embedding
                if len(self.query_cache) >= self.cache_size_limit:
                    # Remove oldest entry if cache is full
                    oldest_key = next(iter(self.query_cache))
                    del self.query_cache[oldest_key]
                
                self.query_cache[query_text] = embedding
                return embedding  # Return the embedding for similarity search 
            except Exception as e: 
                if attempt < max_retries - 1: 
                    wait_time = 2 ** attempt # Exponential backoff
                    print(f"OpenAI error: {e}. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else: 
                    raise e
    
    def build_index(self, embeddings_path: Optional[str] = None, save_path: Optional[str] = None) -> None: 
        """
        Build a FAISS index from course embeddings. 

        Args: 
            embeddings_path: Path to precomputed course embeddings
            save_path: Path to save the FAISS index
        """ 
        if embeddings_path and os.path.exists(embeddings_path): 
            # Load precomputed embeddings 
            self.embeddings = np.load(embeddings_path)
            print(f"Loaded embeddings from {embeddings_path} with shape {self.embeddings.shape}")
        else: 
            # Generate embeddings for all courses 
            print("Generating embeddings for all the courses...")
            self.embeddings = np.zeros((len(self.course_ids), self.embedding_dimension), dtype=np.float32) 

            for i, course_id in enumerate(self.course_ids):
                course = self.course_data[course_id]
                
                # Generate the text representation of the course 
                course_text = f"{course.get('title','')} {course.get('professor','')} {course.get('description','')}{' '.join(course.get('gen_eds',[]))}"

                # Generate embeddings 
                embedding = self.embed_query(course_text)
                self.embeddings[i] = embedding

                if i % 10 == 0:
                    print(f"Processed {i}/{len(self.course_ids)} courses...")

            # Save embeddings if path provided 
            if save_path: 
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                np.save(save_path, self.embeddings)
                print(f"Saved embeddings to {save_path}")
        
        # Normalize embeddings for cosine similarity
        self.embeddings = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        
        # Choose the appropriate index type based on dataset size
        dimension = self.embedding_dimension
        num_courses = len(self.course_ids)
        
        if num_courses < 1000:
            # For small datasets, use a flat index (exact search)
            print(f"Using IndexFlatIP for {num_courses} courses")
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(self.embeddings)
        else:
            # For larger datasets, use IVF (approximate search)
            # Number of clusters - rule of thumb is 4*sqrt(N)
            n_clusters = min(4 * int(np.sqrt(num_courses)), 256)
            print(f"Using IndexIVFFlat with {n_clusters} clusters for {num_courses} courses")
            
            # Create a quantizer
            quantizer = faiss.IndexFlatIP(dimension)
            
            # Create the index
            self.index = faiss.IndexIVFFlat(quantizer, dimension, n_clusters)
            
            # Need to train the index
            if not self.index.is_trained:
                self.index.train(self.embeddings)
            
            # Add vectors to the index
            self.index.add(self.embeddings)
            
            # Set the number of probes (higher = more accurate but slower)
            self.index.nprobe = min(n_clusters // 4, 32)  # Balance between speed and accuracy
        
        print(f"Added {num_courses} courses to FAISS index")

        # Save index if path provided 
        if save_path: 
            index_path = save_path.replace('.npy', '.index')
            faiss.write_index(self.index, index_path)
            print(f"Saved FAISS index to {index_path}")

    
    def search(self, query:str, top_k: int = 5) -> List[Dict[str, Any]]:
        """ 
        Search for courses semantically similar to the query. 

        Args: 
            query: User's natural language query 
            top_k: Number of results to return 
        
        Returns: 
            List of course dictionaries matching the query  
        """

        # Embed the query 
        query_embedding = self.embed_query(query)

        # Reshape for FAISS if needed 
        if len(query_embedding.shape) == 1: 
            query_embedding = np.expand_dims(query_embedding, axis=0)
        
        # Normalize the query embedding for cosine similarity
        query_embedding = query_embedding / np.linalg.norm(query_embedding)

        # Search the FAISS index 
        scores, indices = self.index.search(query_embedding, top_k)

        # Get the course data for the results 
        results = []
        for i, idx in enumerate(indices[0]):
            # Safety check 
            if idx < len(self.course_ids):
                course_id = self.course_ids[idx]
                if course_id in self.course_data: 
                    # Add score to the course data (for IP/cosine, higher is better)
                    course = self.course_data[course_id].copy()
                    course['similarity_score'] = float(scores[0][i])
                    results.append(course)
        return results

    def ensure_list(self, value: Any) -> List: 
        """
            Convert a value to a list if it's not already a list. 

            Args: 
                value: The value to convert to a list 

            Returns: 
                List containing the value 
        """
        if isinstance(value, list):
            return value 
        return [value] 

    
    def filter_courses(self, courses: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]: 
        """
            Filter courses based on advanced course filters (metadata criteria)

            Args: 
                courses: List of course dictionaries 
                filters: Dictionary of filter criteria

        Returns:
            Filtered list of courses
        """
        if not filters:
            return courses

        # Create a cache key from the filters and course IDs
        # This is a simplified approach - for production, consider a more robust hashing mechanism
        course_ids = sorted([course.get('id', course.get('course_id', '')) for course in courses])
        filter_items = sorted([(k, str(v)) for k, v in filters.items()])
        cache_key = str(course_ids) + str(filter_items)

        # Check if we have cached results
        if cache_key in self.filter_cache:
            return self.filter_cache[cache_key]

        filtered_courses = []

        for course in courses:
            include_course = True

            # Filter by concentration
            if 'concentration' in filters and filters['concentration'] and 'concentration' in course:
                filter_concentrations = self.ensure_list(filters['concentration'])
                course_concentrations = self.ensure_list(course['concentration'])

                # Check if the course concentration matches the filter
                if not any(c in course_concentrations for c in filter_concentrations):
                    include_course = False

            # Filter by gen_eds - this needs some work
            if include_course and 'gen_eds' in filters and filters['gen_eds'] and 'gen_eds' in course:
                filter_gen_eds = self.ensure_list(filters['gen_eds'])
                course_gen_eds = self.ensure_list(course['gen_eds'])

                # Check if the course gen_eds matches the filter
                if not any(c in course_gen_eds for c in filter_gen_eds):
                    include_course = False

            # Filter by term
            if include_course and 'term' in filters and filters['term'] and 'term' in course:
                filter_terms = self.ensure_list(filters['term'])
                if course['term'] not in filter_terms:
                    include_course = False

            # Filter by class_times (this is more complex and might need custom logic)
            if include_course and 'class_times' in filters and filters['class_times'] and 'class_times' in course:
                filter_times = self.ensure_list(filters['class_times'])
                course_times = self.ensure_list(course['class_times'])

                # Simplified check - need a better time comparison logic
                if not any(t in course_times for t in filter_times):
                    include_course = False

            # Filter by difficulty
            if include_course and 'difficulty' in filters and filters['difficulty'] and 'difficulty' in course:
                filter_difficulties = self.ensure_list(filters['difficulty'])
                if course['difficulty'] not in filter_difficulties:
                    include_course = False

            # Filter by professor
            if include_course and 'professor' in filters and filters['professor'] and 'professor' in course:
                filter_professors = self.ensure_list(filters['professor'])
                if not any(prof.lower() in course['professor'].lower() for prof in filter_professors):
                    include_course = False

            if include_course:
                filtered_courses.append(course)

        # Cache the results before returning
        if len(self.filter_cache) >= self.cache_size_limit:
            # Remove oldest entry if cache is full
            oldest_key = next(iter(self.filter_cache))
            del self.filter_cache[oldest_key]

        self.filter_cache[cache_key] = filtered_courses
        return filtered_courses

    def hybrid_search(self, query: str, filters: Dict[str, Any] = None, top_k: int = 5) -> Dict[str, Any]:
        """
        Perform hybrid search combining filters and semantic search.

        Args:
            query: User's natural language query
            filters: Dictionary of filters to apply
            top_k: Number of results to return

        Returns:
            Dictionary containing:
            - 'results': List of course dictionaries matching both filters and query
            - 'course_ids': List of course IDs for the results
            - 'total_matches': Total number of courses that matched the criteria
        """
        # If no filters are provided, just do a regular semantic search
        if not filters:
            results = self.search(query, top_k)
            course_ids = [course.get('id', course.get('course_id')) for course in results]
            return {
                'results': results,
                'course_ids': course_ids,
                'total_matches': len(results)
            }

        # Filter courses based on metadata
        filtered_courses = self.filter_courses(list(self.course_data.values()), filters)

        # If no courses match the filters, return empty results
        # Filter courses based on metadata
        filtered_courses = self.filter_courses(list(self.course_data.values()), filters)

        # If no courses match the filters, return empty results
        if not filtered_courses:
            return {
                'results': [],
                'course_ids': [],
                'total_matches': 0,
                'filter_message': 'No courses match the selected filters.'
            }

        # Extract course IDs from filtered courses
        filtered_ids = [course.get('id', course.get('course_id')) for course in filtered_courses]
        total_filtered = len(filtered_ids)

        # Approach 1: Create a temporary index for filtered courses (more efficient)
        if hasattr(self, 'embeddings') and len(filtered_ids) < len(self.course_ids) * 0.8:
            # Create a mapping of filtered course IDs to their original indices
            filtered_indices = []
            id_to_index = {}

            for i, course_id in enumerate(filtered_ids):
                if course_id in self.course_ids:
                    original_idx = self.course_ids.index(course_id)
                    filtered_indices.append(original_idx)
                    id_to_index[len(id_to_index)] = course_id

            if not filtered_indices:
                return {
                    'results': [],
                    'course_ids': [],
                    'total_matches': 0,
                    'filter_message': 'No courses match the selected filters.'
                }

            # Get embeddings for filtered courses
            filtered_embeddings = self.embeddings[filtered_indices]

            # Normalize embeddings for cosine similarity
            filtered_embeddings = filtered_embeddings / np.linalg.norm(filtered_embeddings, axis=1, keepdims=True)

            # Create temporary index
            temp_index = faiss.IndexFlatIP(self.embedding_dimension)
            temp_index.add(filtered_embeddings)

            # Embed and normalize the query
            query_embedding = self.embed_query(query)
            if len(query_embedding.shape) == 1:
                query_embedding = np.expand_dims(query_embedding, axis=0)
            query_embedding = query_embedding / np.linalg.norm(query_embedding)

            # Search the temporary index
            scores, indices = temp_index.search(query_embedding, min(top_k, len(filtered_embeddings)))

            # Get the course data for the results
            results = []
            result_ids = []
            for i, idx in enumerate(indices[0]):
                if idx < len(id_to_index):
                    course_id = id_to_index[idx]
                    if course_id in self.course_data:
                        course = self.course_data[course_id].copy()
                        # With IP/cosine similarity, the score is directly usable (higher is better)
                        course['similarity_score'] = float(scores[0][i])
                        # Ensure q_guide_summary is included if available
                        if 'q_guide_summary' not in course and 'comments' in course:
                            course['q_guide_summary'] = self._generate_mini_summary(course)
                        results.append(course)
                        result_ids.append(course_id)

            return {
                'results': results,
                'course_ids': result_ids,
                'total_matches': total_filtered,
                'filter_applied': True
            }

        # Approach 2: search-then-filter (when we don't have embeddings stored or filters are not very selective)
        else:
            # Over-fetch to ensure we have enough results after filtering
            all_results = self.search(query, min(top_k * 3, len(self.course_ids)))

            # Filter the search results
            filtered_results = self.filter_courses(all_results, filters)

            # Get the top_k filtered results
            final_results = filtered_results[:top_k]
            result_ids = [course.get('id', course.get('course_id')) for course in final_results]
            
            # Ensure each course has a q_guide_summary
            for course in final_results:
                if 'q_guide_summary' not in course and 'comments' in course:
                    course['q_guide_summary'] = self._generate_mini_summary(course)

            return {
                'results': final_results,
                'course_ids': result_ids,
                'total_matches': len(filtered_results),
                'filter_applied': True
            }
    
    def _generate_mini_summary(self, course: Dict[str, Any]) -> str:
        """
        Generate a minimal summary for courses without a q_guide_summary.
        This is a fallback for courses that haven't been processed by the Q Guide summary generator.
        
        Args:
            course: Course dictionary
            
        Returns:
            A brief summary based on available course data
        """
        title = course.get('title', 'Unknown Course')
        professor = course.get('professor', 'Unknown Professor')
        workload = course.get('workload', 'Not specified')
        q_rating = course.get('q_rating', 'Not rated')
        
        comments = course.get('comments', [])
        comment_count = len(comments)
        
        if comment_count > 0:
            return f"{title} taught by {professor}. Workload: {workload}, Q Rating: {q_rating}. {comment_count} student comments available."
        else:
            return f"{title} taught by {professor}. Workload: {workload}, Q Rating: {q_rating}. No student comments available."
    
    def get_course_cards(self, results: List[Dict[str, Any]], include_summary: bool = True) -> List[Dict[str, Any]]:
        """
        Format search results into course cards suitable for display.
        
        Args:
            results: List of course dictionaries from search or hybrid_search
            include_summary: Whether to include the Q Guide summary
            
        Returns:
            List of formatted course cards
        """
        course_cards = []
        
        for course in results:
            # Create a course card with essential information
            card = {
                'id': course.get('id', course.get('course_id')),
                'title': course.get('title', 'Unknown Course'),
                'professor': course.get('professor', 'Unknown Professor'),
                'description': course.get('description', ''),
                'concentration': course.get('concentration', ''),
                'difficulty': course.get('difficulty', ''),
                'workload': course.get('workload', ''),
                'term': course.get('term', ''),
                'gen_eds': course.get('gen_eds', []),
                'similarity_score': course.get('similarity_score', 0),
                'q_guide_summary': course.get('q_guide_summary', 'No Q Guide summary available.')
            }
            course_cards.append(card)
        
        return course_cards
    
    def load_course_data_from_db(self, conn, table_name: str = 'courses'):
        """
        Load course data from a database connection.
        
        Args:
            conn: Database connection object (sqlite3 or psycopg2)
            table_name: Name of the courses table
            
        Returns:
            None (updates self.course_data and self.course_ids)
        """
        try:
            # Get database cursor
            cursor = conn.cursor()
            
            # Query all courses
            cursor.execute(f"SELECT id, course_data FROM {table_name}")
            rows = cursor.fetchall()
            
            # Process results
            self.course_data = {}
            for row in rows:
                course_id = row[0]
                
                # Try to parse course_data JSON
                try:
                    course_data = json.loads(row[1])
                    self.course_data[course_id] = course_data
                except (json.JSONDecodeError, TypeError):
                    # If JSON parsing fails, skip this course
                    print(f"Warning: Could not parse course data for {course_id}")
                    continue
            
            # Extract course IDs
            self.course_ids = list(self.course_data.keys())
            
            print(f"Loaded {len(self.course_data)} courses from database")
            
        except Exception as e:
            print(f"Error loading courses from database: {e}")
            
    def get_course_by_id(self, course_id: str) -> Dict[str, Any]:
        """
        Get a course by its ID.
        
        Args:
            course_id: The ID of the course to retrieve
            
        Returns:
            Course dictionary or None if not found
        """
        if course_id in self.course_data:
            course = self.course_data[course_id].copy()
            # Ensure q_guide_summary is included if available
            if 'q_guide_summary' not in course and 'comments' in course:
                course['q_guide_summary'] = self._generate_mini_summary(course)
            return course
        return None


            
                
                   
                
        
    

    
    
