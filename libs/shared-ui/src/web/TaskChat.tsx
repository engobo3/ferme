import React, { useState } from 'react';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    taskId: string;
}

interface TaskChatProps {
    messages: ChatMessage[];
    currentUserId: string;
    onSend: (text: string) => void;
}

export function TaskChat({ messages, currentUserId, onSend }: TaskChatProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {messages.map(msg => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: '8px',
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: '70%',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    backgroundColor: isMe ? '#2563EB' : '#F3F4F6',
                                    color: isMe ? '#FFFFFF' : '#1F2937',
                                }}
                            >
                                {!isMe && (
                                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '2px' }}>
                                        {msg.senderName}
                                    </div>
                                )}
                                <div style={{ fontSize: '14px' }}>{msg.text}</div>
                                <div style={{ fontSize: '10px', color: isMe ? '#BFDBFE' : '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', padding: '8px', borderTop: '1px solid #E5E7EB', gap: '8px' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    style={{
                        flex: 1, border: '1px solid #D1D5DB', borderRadius: '20px',
                        padding: '8px 16px', fontSize: '14px', outline: 'none',
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none',
                        borderRadius: '20px', padding: '8px 16px', fontWeight: 600,
                        fontSize: '14px', cursor: 'pointer',
                    }}
                >
                    Envoyer
                </button>
            </div>
        </div>
    );
}
