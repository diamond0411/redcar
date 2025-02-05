import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import Head from 'next/head';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as linkify from 'linkifyjs';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const responseContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setResponse('');
    setError('');
    setIsLoading(true)
    setIsScrolling(false)
    const links = linkify.find(question)
    const domain = links.find(link=>link.type === "url")?.value || null
    if (domain == null) {
        setError('Please include the company\'s url in the question');
        setIsLoading(false)
        return
    }
    try {
      const stream = await fetch(process.env.LLMQUERY_URL+"/llmquery/stream", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection':  'keep-alive',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          prompt: question,
          domain: domain
        }),
      })
      if (stream.body != null) {
        setIsLoading(false)
        setIsScrolling(true)
        const reader = stream.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const lines = value.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.replace(/^data:\s*/, '').trim();
              console.log('Received:', data);
              setResponse((prev) => {
                if (prev.length === 0) return data;
                const punctuationMarks = ['.', ',', '!', '?', ';', ':', ')', ']', '}'];
                const lastChar = prev[prev.length - 1];
                const firstChar = data[0];
                let formattedData = data;
                if ((punctuationMarks.includes(lastChar) && firstChar !== ' ') || (!punctuationMarks.includes(firstChar) && lastChar !== ' ')) {
                  formattedData = ' ' + data;
                }
                return prev + formattedData;
              });
            }
          }
        }
        setIsScrolling(false)
      }
    } catch (error) {
      console.error('Streaming setup error:', error);
      setIsLoading(false);
      setIsScrolling(false)
      setResponse('An error occurred while setting up the stream.');
    }
  };

  useLayoutEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Head>
        <title>Company Info Asker</title>
      </Head>

      <div className="w-full max-w-xl bg-white shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question..."
            className="w-full text-black"
            disabled={isLoading || isScrolling}
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !question.trim() || isScrolling}
          >
            {isLoading || isScrolling ? 'Loading' : 'Submit'}
          </Button>
        </form>

        {(response) && (
          <div 
            ref={responseContainerRef}
            className="p-6 bg-gray-50 max-h-[300px] overflow-y-auto text-sm text-black"
          >
            {response}
          </div>
        )}
        {isLoading && (
            <div className="text-gray-500 animate-pulse text-center">Waiting for response...</div>
        )}
        {error && (
            <div className="text-red-500 animate-pulse text-center">
                {error}
            </div>
        )}
      </div>
    </div>
  );
}