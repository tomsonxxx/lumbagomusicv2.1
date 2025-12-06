
import React, { useState } from 'react';
import { SmartPlaylistRule, SmartPlaylistField, SmartPlaylistRuleOperator } from '../types';

declare const uuid: { v4: () => string; };

interface CreateSmartPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, rules: SmartPlaylistRule[]) => void;
}

const CreateSmartPlaylistModal: React.FC<CreateSmartPlaylistModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [rules, setRules] = useState<SmartPlaylistRule[]>([
      { id: '1', field: 'genre', operator: 'contains', value: '' }
  ]);

  if (!isOpen) return null;

  const addRule = () => {
      setRules([...rules, { id: uuid.v4(), field: 'genre', operator: 'contains', value: '' }]);
  };

  const removeRule = (id: string) => {
      if (rules.length > 1) {
          setRules(rules.filter(r => r.id !== id));
      }
  };

  const updateRule = (id: string, updates: Partial<SmartPlaylistRule>) => {
      setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
          onCreate(name.trim(), rules);
          setName('');
          setRules([{ id: uuid.v4(), field: 'genre', operator: 'contains', value: '' }]);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[70] backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-xl shadow-2xl p-6 w-full max-w-lg animate-fade-in-scale border border-lumbago-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-lumbago-accent">⚡</span> Nowa Smart Playlista
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nazwa Playlisty</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="np. House 2024"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded focus:ring-1 focus:ring-lumbago-accent outline-none text-white placeholder-slate-600"
                    autoFocus
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reguły (WSZYSTKIE muszą być spełnione)</label>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {rules.map((rule, idx) => (
                        <div key={rule.id} className="flex gap-2 items-center bg-slate-800/50 p-2 rounded border border-slate-700">
                            <select 
                                value={rule.field}
                                onChange={(e) => updateRule(rule.id, { field: e.target.value as SmartPlaylistField })}
                                className="bg-slate-900 border border-slate-700 rounded text-xs p-1.5 text-white focus:outline-none w-24"
                            >
                                <option value="genre">Gatunek</option>
                                <option value="year">Rok</option>
                                <option value="bpm">BPM</option>
                                <option value="artist">Artysta</option>
                                <option value="title">Tytuł</option>
                            </select>

                            <select 
                                value={rule.operator}
                                onChange={(e) => updateRule(rule.id, { operator: e.target.value as SmartPlaylistRuleOperator })}
                                className="bg-slate-900 border border-slate-700 rounded text-xs p-1.5 text-white focus:outline-none w-24"
                            >
                                <option value="contains">zawiera</option>
                                <option value="equals">równa się</option>
                                <option value="gt">większe niż</option>
                                <option value="lt">mniejsze niż</option>
                                <option value="between">pomiędzy</option>
                            </select>

                            {rule.operator === 'between' ? (
                                <div className="flex gap-1 flex-1">
                                    <input 
                                        type="text" 
                                        value={rule.value} 
                                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded text-xs p-1.5 text-white focus:outline-none min-w-0"
                                        placeholder="Od"
                                    />
                                    <input 
                                        type="text" 
                                        value={rule.value2 || ''} 
                                        onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded text-xs p-1.5 text-white focus:outline-none min-w-0"
                                        placeholder="Do"
                                    />
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={rule.value} 
                                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded text-xs p-1.5 text-white focus:outline-none min-w-0"
                                    placeholder="Wartość..."
                                />
                            )}

                            {rules.length > 1 && (
                                <button type="button" onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-300 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addRule} className="mt-2 text-xs text-lumbago-accent hover:underline font-bold flex items-center gap-1">
                    + Dodaj warunek
                </button>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-bold text-slate-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                    Anuluj
                </button>
                <button type="submit" className="flex-1 py-2 text-sm font-bold text-lumbago-dark bg-lumbago-accent rounded hover:bg-[#00ff88] transition-colors shadow-lg shadow-lumbago-accent/20">
                    Utwórz Playlistę
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSmartPlaylistModal;
