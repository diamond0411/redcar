import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/pages/index';
import * as linkify from 'linkifyjs';
import '@testing-library/jest-dom';
import { ReadableStream } from 'stream/web';
import { TextEncoder } from 'util';

jest.mock('@/components/login', () => ({
    __esModule: true,
    default: jest.fn(({ onLogin }) => (
        <button onClick={() => onLogin('mock-token')}>Mock Login</button>
    )),
}));

jest.mock('uuid', () => ({
    v4: () => 'mock-uuid',
}));

jest.mock('linkifyjs', () => ({
    find: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Chat Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        mockFetch.mockReset();
    });

    test('renders login form when no token exists', async () => {
        render(<Home />);
        expect(screen.getByText('Mock Login')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Ask your question...')).toBeNull();
    });

    test('renders chat interface when token exists', async () => {
        localStorageMock.setItem('token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([{
                _id: '1',
                userID: 'user1',
                prompt: 'Test question',
                response: 'Test response'
            }]),
        });

        await act(async () => {
            render(<Home />);
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Ask your question...')).toBeInTheDocument();
            expect(screen.getByText('Test question')).toBeInTheDocument();
            expect(screen.getByText('Test response')).toBeInTheDocument();
        });
    });

    test('handles login and fetches history', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        render(<Home />);
        fireEvent.click(screen.getByText('Mock Login'));

        await waitFor(() => {
            expect(localStorageMock.getItem('token')).toBe('mock-token');
            expect(mockFetch).toHaveBeenCalledWith('/api/history', expect.anything());
        });
    });

    test('handles sign out', async () => {
        localStorageMock.setItem('token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await act(async () => {
            render(<Home />);
        });

        fireEvent.click(screen.getByText('Sign Out'));

        await waitFor(() => {
            expect(localStorageMock.getItem('token')).toBeNull();
            expect(screen.getByText('Mock Login')).toBeInTheDocument();
        });
    });

    test('shows error when submitting without URL', async () => {
        localStorageMock.setItem('token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        (linkify.find as jest.Mock).mockReturnValue([]);

        await act(async () => {
            render(<Home />);
        });

        fireEvent.change(screen.getByPlaceholderText('Ask your question...'), {
            target: { value: 'Test question' }
        });
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText("Please include the company's url in the question")).toBeInTheDocument();
        });
    });

    test('handles successful question submission and streaming response', async () => {
        localStorageMock.setItem('token', 'test-token');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        const mockStreamResponse = {
            ok: true,
            headers: new Headers({ 'Content-Type': 'text/event-stream' }),
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: First chunk '));
                    controller.enqueue(new TextEncoder().encode('data: Second chunk'));
                    controller.close();
                },
            }),
        };

        (linkify.find as jest.Mock).mockReturnValue([{ type: 'url', value: 'http://example.com' }]);
        mockFetch.mockResolvedValueOnce(mockStreamResponse);

        await act(async () => {
            render(<Home />);
        });

        fireEvent.change(screen.getByPlaceholderText('Ask your question...'), {
            target: { value: 'Test question http://example.com' }
        });
        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText('Test question http://example.com')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('First chunk Second chunk')).toBeInTheDocument();
        });
    });

    test('shows error when fetching history fails', async () => {
        localStorageMock.setItem('token', 'test-token');
        mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

        await act(async () => {
            render(<Home />);
        });

        await waitFor(() => {
            expect(screen.getByText('Failed to load chat history.')).toBeInTheDocument();
        });
    });
});