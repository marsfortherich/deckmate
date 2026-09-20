/**
 * DeckBuilder Component
 * 
 * UI for building a custom deck from the card library
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { CARD_LIBRARY, getRarityColor, validateDeck } from '../../cards/cardLibrary.js';
import { Card } from '../../cards/types/card.js';
import { saveDeck, updateDeck, getDeck, canCreateDeck } from '../../services/deckService';
import { getErrorMessage } from '../../utils/errors';

interface DeckBuilderProps {
  onDeckComplete: (deck: Card[]) => void;
  onCancel: () => void;
  saveMode?: boolean; // If true, save deck instead of just building
  deckId?: string; // Optional: Edit existing deck
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ 
  onDeckComplete, 
  onCancel,
  saveMode = false,
  deckId 
}) => {
  const { user } = useAuth();
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deckName, setDeckName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const [loading, setLoading] = useState(!!deckId);
  const isEditMode = !!deckId;
  
  // Load existing deck if editing
  useEffect(() => {
    if (!user || !deckId) return;
    
    const loadDeck = async () => {
      try {
        const deck = await getDeck(user.uid, deckId);
        if (!deck) {
          alert('Deck nicht gefunden');
          onCancel();
          return;
        }
        
        setDeckName(deck.name);
        
        // Zähle wie oft jede Card vorkommt
        const cardCounts = new Map<string, number>();
        deck.cards.forEach(card => {
          const baseId = card.id.replace(/-copy-\d+$/, '');
          cardCounts.set(baseId, (cardCounts.get(baseId) || 0) + 1);
        });
        
        setSelectedCards(cardCounts);
      } catch (err) {
        console.error('Error loading deck:', err);
        alert('Fehler beim Laden des Decks');
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    
    loadDeck();
  }, [user, deckId, onCancel]);
  
  // Check if user can create more decks (max 5)
  React.useEffect(() => {
    if (!user || !saveMode || isEditMode) return;
    
    const checkLimit = async () => {
      const allowed = await canCreateDeck(user.uid);
      setCanCreate(allowed);
    };
    
    checkLimit();
  }, [user, saveMode, isEditMode]);
  
  // Get unique categories
  const categories = ['All', ...Array.from(new Set(CARD_LIBRARY.map(def => def.category)))];
  
  // Filter cards by category
  const filteredCards = selectedCategory === 'All' 
    ? CARD_LIBRARY 
    : CARD_LIBRARY.filter(def => def.category === selectedCategory);
  
  // Calculate total cards
  const totalCards = Array.from(selectedCards.values()).reduce((sum, count) => sum + count, 0);
  
  // Validation
  const validation = validateDeck(selectedCards);
  
  const addCard = (cardId: string, maxCopies: number) => {
    const current = selectedCards.get(cardId) || 0;
    if (current < maxCopies) {
      const newMap = new Map(selectedCards);
      newMap.set(cardId, current + 1);
      setSelectedCards(newMap);
    }
  };
  
  const removeCard = (cardId: string) => {
    const current = selectedCards.get(cardId) || 0;
    if (current > 0) {
      const newMap = new Map(selectedCards);
      if (current === 1) {
        newMap.delete(cardId);
      } else {
        newMap.set(cardId, current - 1);
      }
      setSelectedCards(newMap);
    }
  };
  
  const handleComplete = async () => {
    if (!validation.isValid || totalCards !== 20) {
      return;
    }
    
    // Build deck array from selected cards
    const deck: Card[] = [];
    selectedCards.forEach((count, cardId) => {
      const cardDef = CARD_LIBRARY.find(def => def.card.id === cardId);
      if (cardDef) {
        for (let i = 0; i < count; i++) {
          // Create unique instances
          deck.push({
            ...cardDef.card,
            id: `${cardDef.card.id}-copy-${i}`,
          });
        }
      }
    });
    
    // If save mode, show name input
    if (saveMode) {
      setShowNameInput(true);
    } else {
      onDeckComplete(deck);
    }
  };

  const handleSaveDeck = async () => {
    if (!user || !deckName.trim()) return;

    setSaving(true);
    try {
      // Build deck array
      const deck: Card[] = [];
      selectedCards.forEach((count, cardId) => {
        const cardDef = CARD_LIBRARY.find(def => def.card.id === cardId);
        if (cardDef) {
          for (let i = 0; i < count; i++) {
            deck.push({
              ...cardDef.card,
              id: `${cardDef.card.id}-copy-${i}`,
            });
          }
        }
      });

      if (isEditMode && deckId) {
        // Update existing deck
        await updateDeck(user.uid, deckId, deckName.trim(), deck);
      } else {
        // Create new deck
        await saveDeck(user.uid, deckName.trim(), deck);
      }
      
      onDeckComplete(deck); // Navigate back
    } catch (err) {
      alert(`Fehler beim Speichern: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f1f5f9',
      }}>
        Lädt Deck...
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px',
            marginBottom: '8px',
            color: '#f1f5f9',
          }}>
            🃏 {isEditMode ? `${deckName} bearbeiten` : 'Deck Builder'}
          </h1>
          <p style={{ color: '#94a3b8' }}>
            {saveMode ? 'Erstelle ein Deck (genau 20 Karten)' : 'Build your custom deck (Any number of cards)'}
          </p>
        </div>
        
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Menu
        </button>
      </div>
      
      {/* Deck Summary */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ 
            fontSize: '24px', 
            color: saveMode && totalCards === 20 ? '#10b981' : '#f1f5f9', 
            marginBottom: '8px' 
          }}>
            Deck: {totalCards} {saveMode ? '/ 20' : ''} cards
          </div>
          {saveMode && !canCreate && !isEditMode && (
            <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '4px' }}>
              ⚠️ Du hast bereits 5 Decks (Maximum erreicht)
            </div>
          )}
          {saveMode && totalCards !== 20 && totalCards > 0 && (
            <div style={{ color: '#f59e0b', fontSize: '14px' }}>
              ⚠️ Ein Deck muss genau 20 Karten haben
            </div>
          )}
          {!validation.isValid && (
            <div style={{ color: '#f87171', fontSize: '14px' }}>
              {validation.errors.map((error, i) => (
                <div key={i}>❌ {error}</div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={handleComplete}
          disabled={
            !validation.isValid || 
            totalCards === 0 || 
            (saveMode && totalCards !== 20) ||
            (saveMode && !isEditMode && !canCreate)
          }
          style={{
            padding: '12px 32px',
            backgroundColor: 
              validation.isValid && 
              totalCards > 0 && 
              (!saveMode || (totalCards === 20 && (isEditMode || canCreate)))
                ? '#10b981' 
                : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 
              validation.isValid && 
              totalCards > 0 && 
              (!saveMode || (totalCards === 20 && (isEditMode || canCreate)))
                ? 'pointer' 
                : 'not-allowed',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {saveMode ? (isEditMode ? '💾 Änderungen speichern' : '💾 Deck speichern') : '✓ Complete Deck'}
        </button>
      </div>
      
      {/* Category Filter */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCategory === category ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Card Library */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {filteredCards.map((cardDef) => {
          const count = selectedCards.get(cardDef.card.id) || 0;
          const atMax = count >= cardDef.maxCopies;
          
          return (
            <div
              key={cardDef.card.id}
              style={{
                padding: '16px',
                backgroundColor: '#16213e',
                borderRadius: '8px',
                border: `2px solid ${count > 0 ? '#10b981' : '#374151'}`,
              }}
            >
              {/* Card Header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}>
                  <h3 style={{ 
                    color: getRarityColor(cardDef.card.rarity || 'common'),
                    fontSize: '18px',
                    margin: 0,
                  }}>
                    {cardDef.card.name}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    backgroundColor: '#374151',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {cardDef.category}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {cardDef.card.description}
                </div>
              </div>
              
              {/* Card Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => removeCard(cardDef.card.id)}
                    disabled={count === 0}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: count === 0 ? '#374151' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: count === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    −
                  </button>
                  
                  <span style={{
                    fontSize: '18px',
                    color: '#f1f5f9',
                    fontWeight: 'bold',
                    minWidth: '80px',
                    textAlign: 'center',
                  }}>
                    {count} / {cardDef.maxCopies}
                  </span>
                  
                  <button
                    onClick={() => addCard(cardDef.card.id, cardDef.maxCopies)}
                    disabled={atMax || totalCards >= 20}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: atMax || totalCards >= 20 ? '#374151' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: atMax || totalCards >= 20 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Name Input Modal */}
      {showNameInput && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h2 style={{ marginBottom: '16px', color: '#f1f5f9' }}>
              💾 Deck speichern
            </h2>
            <p style={{ marginBottom: '16px', color: '#94a3b8' }}>
              Gib deinem Deck einen Namen:
            </p>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="z.B. Mein Lieblingsdeck"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '24px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f1f5f9',
                fontSize: '16px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deckName.trim()) {
                  handleSaveDeck();
                }
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveDeck}
                disabled={!deckName.trim() || saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: deckName.trim() && !saving ? '#10b981' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deckName.trim() && !saving ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setDeckName('');
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
