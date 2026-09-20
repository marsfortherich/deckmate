/**
 * Deck Manager - Übersicht aller gespeicherten Decks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { SavedDeck, getUserDecks, deleteDeck, MAX_DECKS } from '../../services/deckService';
import { getErrorMessage } from '../../utils/errors';

export const DeckManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDecks = async () => {
      try {
        const userDecks = await getUserDecks(user.uid);
        setDecks(userDecks);
      } catch (err) {
        console.error('Error loading decks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, [user]);

  const handleDelete = async (deckId: string) => {
    if (!user) return;

    try {
      await deleteDeck(user.uid, deckId);
      setDecks(decks.filter(d => d.id !== deckId));
      setDeletingId(null);
    } catch (err) {
      alert(`Fehler beim Löschen: ${getErrorMessage(err)}`);
    }
  };

  const handleEdit = (deckId: string) => {
    navigate(`/deck-builder/${deckId}`);
  };

  const handleCreateNew = () => {
    navigate('/deck-builder/new');
  };

  const canCreateNew = decks.length < MAX_DECKS;

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f1f5f9',
        }}
      >
        Lädt Decks...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        color: '#f1f5f9',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '8px', fontSize: '32px' }}>🃏 Meine Decks</h1>
            <p style={{ color: '#94a3b8' }}>
              {decks.length} / {MAX_DECKS} Decks
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Zurück
          </button>
        </div>

        {/* Create New Deck Button */}
        <button
          onClick={handleCreateNew}
          disabled={!canCreateNew}
          style={{
            width: '100%',
            padding: '20px',
            marginBottom: '24px',
            backgroundColor: canCreateNew ? '#3b82f6' : '#374151',
            color: 'white',
            border: canCreateNew ? '2px dashed #60a5fa' : '2px dashed #475569',
            borderRadius: '8px',
            cursor: canCreateNew ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            fontWeight: '600',
          }}
        >
          {canCreateNew ? '➕ Neues Deck erstellen' : `⚠️ Maximum erreicht (${MAX_DECKS} Decks)`}
        </button>

        {/* Deck List */}
        {decks.length === 0 ? (
          <div
            style={{
              padding: '60px 40px',
              textAlign: 'center',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              Du hast noch keine Decks erstellt
            </p>
            <p>Erstelle dein erstes Deck um zu spielen!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {decks.map((deck) => (
              <div
                key={deck.id}
                style={{
                  padding: '24px',
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: '2px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '24px' }}>
                    {deck.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {deck.cards.length} Karten • Erstellt am{' '}
                    {deck.createdAt.toDate().toLocaleDateString('de-DE')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(deck.id)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    ✏️ Bearbeiten
                  </button>

                  {/* Delete Button */}
                  {deletingId === deck.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(deck.id)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                        }}
                      >
                        Bestätigen
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#475569',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeletingId(deck.id)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      🗑️ Löschen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
