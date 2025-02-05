import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import Head from 'next/head';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as linkify from 'linkifyjs';
import LoginSignUp from '@/components/login';

interface Message {
  id: string; 
  text: string;
  sender: 'user' | 'assistant';
}

interface Log {
  _id: string;
  userID: string;
  prompt: string;
  response: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const responseContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (token) {
      fetchChatLogs();
    }
  }, [token]);

  const fetchChatLogs = async () => {
    try {
      const response = await fetch('/api/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chat logs');
      }
      const data: Log[] = await response.json();
      const formattedLogs: Message[] = data.flatMap((log) => [
        {
          id: `${log._id}-user`,
          text: log.prompt,
          sender: 'user',
        },
        {
          id: `${log._id}-response`,
          text: log.response,
          sender: 'assistant',
        },
      ]);

      setChatHistory(formattedLogs);
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      setError('Failed to load chat history.');
    }
  };

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setToken(token);
    setQuestion('');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setChatHistory([]); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setError('');
    setIsLoading(true);
    setIsScrolling(false);

    const links = linkify.find(question);
    const domain = links.find((link) => link.type === 'url')?.value || null;
    if (domain == null) {
      setError("Please include the company's url in the question");
      setIsLoading(false);
      return;
    }
    setChatHistory((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, text: question, sender: 'user' },
    ]);

    try {
      const stream = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/llmquery/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: question,
          domain: domain,
        }),
      });

      if (stream.body != null) {
        setIsLoading(false);
        setIsScrolling(true);
        const reader = stream.body.pipeThrough(new TextDecoderStream()).getReader();
        let assistantMessage = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const lines = value.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.replace(/^data:\s/, '');
              assistantMessage += data;
              setChatHistory((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage.sender === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, text: assistantMessage },
                  ];
                } else {
                  return [
                    ...prev,
                    { id: `assistant-${Date.now()}`, text: assistantMessage, sender: 'assistant' },
                  ];
                }
              });
            }
          }
        }
        setIsScrolling(false);
      }
    } catch (error) {
      console.error('Streaming setup error:', error);
      setIsLoading(false);
      setIsScrolling(false);
      setChatHistory((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, text: 'An error occurred while setting up the stream.', sender: 'assistant' },
      ]);
    }
  };

  useLayoutEffect(() => {
    if (responseContainerRef.current) {
      responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (!token) {
    return <LoginSignUp onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Head>
        <title>Company Info Asker</title>
      </Head>

      <div className="w-full max-w-xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 flex justify-end">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-sm text-red-600 hover:bg-red-50"
          >
            Sign Out
          </Button>
        </div>

        <div
          ref={responseContainerRef}
          className="p-6 bg-gray-50 max-h-[400px] overflow-y-auto space-y-4"
        >
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-xl shadow-md ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                style={{
                  borderRadius: message.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                }}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>

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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading || !question.trim() || isScrolling}
          >
            {isLoading || isScrolling ? 'Loading...' : 'Submit'}
          </Button>
        </form>

        {isLoading && (
          <div className="text-gray-500 animate-pulse text-center">Waiting for response...</div>
        )}
        {error && <div className="text-red-500 animate-pulse text-center">{error}</div>}
      </div>
    </div>
  );
}