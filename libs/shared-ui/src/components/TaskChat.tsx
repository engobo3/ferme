import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

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

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={m => m.id}
                inverted
                renderItem={({ item }) => {
                    const isMe = item.senderId === currentUserId;
                    return (
                        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                            {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                            <Text style={[styles.messageText, isMe && styles.myText]}>{item.text}</Text>
                            <Text style={styles.timestamp}>
                                {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    );
                }}
            />
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Message..."
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Text style={styles.sendText}>Envoyer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bubble: { padding: 10, borderRadius: 12, marginVertical: 4, marginHorizontal: 12, maxWidth: '80%' },
    myBubble: { backgroundColor: '#2563EB', alignSelf: 'flex-end' },
    theirBubble: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start' },
    senderName: { fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' },
    messageText: { fontSize: 14, color: '#1F2937' },
    myText: { color: '#FFFFFF' },
    timestamp: { fontSize: 10, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },
    inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    input: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    sendButton: { marginLeft: 8, backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
    sendText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
