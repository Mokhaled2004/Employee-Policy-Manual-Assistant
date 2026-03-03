import numpy as np

class SemanticGuardrail:
    def __init__(self, embeddings):
        self.embeddings = embeddings
        # List of out-of-scope topics to block early
        self.banned_topics = [
            "how to cook", "medical advice", "weather", "gaming", 
            "programming code", "jokes", "politics", "religion"
        ]
        self.banned_embeddings = [self.embeddings.embed_query(t) for t in self.banned_topics]

    def is_out_of_scope(self, query: str, threshold: float = 0.75):
        query_vec = self.embeddings.embed_query(query)
        for banned_vec in self.banned_embeddings:
            similarity = np.dot(query_vec, banned_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(banned_vec))
            if similarity > threshold:
                return True
        return False