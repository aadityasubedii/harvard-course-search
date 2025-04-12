# LLM Integration - File Roles and Step-by-Step Plan

## 📁 Folder Structure & File Roles (inside backend/llm/)

backend/llm/
├── prompts/ # Stores raw prompt templates used for LLM
│ ├── course_search_prompt.txt # Prompt for finding courses based on interest
│ ├── course_compare_prompt.txt # Prompt for comparing two courses
│ └── personalized_recommend_prompt.txt # Prompt for personalized course suggestions
│
├── utils/
│ ├── intent_parser.py # Determines user intent from input query
│ ├── semantic_search.py # Performs vector search over course embeddings
│ └── query_router.py # Routes parsed intent to correct chain logic
│
├── chains/
│ ├── search_chain.py # LLM logic for search queries
│ ├── compare_chain.py # LLM logic for comparing two courses
│ └── suggest_chain.py # LLM logic for personalized recommendations
│
├── llm_router.py # Main entry point to process user queries via LLM
├── prompt_templates.py # Loads and formats prompt templates for use
└── config.py # API keys, model version, embedding settings

---

Plan

- Create `llm/` directory and file structure.
- Set up `config.py` with API keys and model configs.
- Write base prompt files in `prompts/` folder.
- Build `prompt_templates.py` to load and format prompt files.
- Create `intent_parser.py` to classify query intent.
- Create `query_router.py` to delegate intent to the right chain.
- Implement `llm_router.py` as main controller for LLM logic.
- Test initial routing with dummy outputs.
- Build `semantic_search.py` for vector similarity search (FAISS + embeddings).
- Implement `search_chain.py` using semantic results + prompt.
- Implement `compare_chain.py` using structured course input.
- Implement `suggest_chain.py` using user profile data.
- Add basic memory/session context (via LangChain or cache).
- Inject personalization (e.g., concentration, year) into prompts.
- Format LLM responses in clean JSON/Markdown.
- Test with 50–100 example queries.
