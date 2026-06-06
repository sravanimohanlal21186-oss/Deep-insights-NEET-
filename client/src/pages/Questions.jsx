import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// React Query client for efficient caching
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

function Questions() {
  const [page, setPage] = useState(1);
  const [subject, setSubject] = useState('');

  // Use React Query for automatic caching and background refetching
  const { data, isLoading, error } = useQuery(
    ['questions', page, subject],
    async () => {
      const response = await axiosInstance.get('/questions', {
        params: { page, limit: 20, subject },
      });
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      keepPreviousData: true,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>NEET Questions</h1>
      <div>
        <input
          type="text"
          placeholder="Filter by subject"
          onChange={(e) => { setSubject(e.target.value); setPage(1); }}
        />
      </div>
      
      <div>
        {data?.questions?.map((q) => (
          <div key={q.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px' }}>
            <h3>{q.question}</h3>
            <div>
              {q.options?.map((opt, idx) => (
                <label key={idx} style={{ display: 'block' }}>
                  <input type="radio" name={q.id} value={opt} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span> Page {page} of {data?.pagination?.pages} </span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= data?.pagination?.pages}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Questions;
