'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import type { Child } from '@/lib/types'

const AVATARS = ['🧒', '👦', '👧', '🧒🏽', '👦🏻', '👧🏾', '🦸', '🧚', '🦄', '🐻', '🐰', '🐱']

export default function ChildrenPage() {
    const { children: childProfiles, refreshChildren, user } = useAuth()
    const [editing, setEditing] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editAge, setEditAge] = useState(3)
    const [editAvatar, setEditAvatar] = useState('🧒')
    const [editPin, setEditPin] = useState('0000')
    const supabase = createClient()

    const startEdit = (child: Child) => {
        setEditing(child.id)
        setEditName(child.name)
        setEditAge(child.age)
        setEditAvatar(child.avatar)
        setEditPin(child.pin_code)
    }

    const saveEdit = async () => {
        if (!editing) return
        await supabase.from('children').update({
            name: editName,
            age: editAge,
            avatar: editAvatar,
            pin_code: editPin,
        }).eq('id', editing)
        await refreshChildren()
        setEditing(null)
    }

    const deleteChild = async (id: string) => {
        if (!confirm('Remove this child profile?')) return
        await supabase.from('children').delete().eq('id', id)
        await refreshChildren()
    }

    return (
        <div>
            <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-black text-gray-800 mb-6"
            >
                Child Profiles 👶
            </motion.h1>

            <div className="space-y-4">
                {childProfiles.map((child, i) => (
                    <motion.div
                        key={child.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="card-playful"
                    >
                        {editing === child.id ? (
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-petal-pink focus:outline-none"
                                    />
                                    <select
                                        value={editAge}
                                        onChange={(e) => setEditAge(Number(e.target.value))}
                                        className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-petal-pink focus:outline-none"
                                    >
                                        {[2, 3, 4, 5, 6].map(a => <option key={a} value={a}>Age {a}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {AVATARS.map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setEditAvatar(a)}
                                            className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${editAvatar === a ? 'bg-petal-pink/20 ring-2 ring-petal-pink' : 'bg-gray-100'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    value={editPin}
                                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    maxLength={4}
                                    placeholder="PIN"
                                    className="w-32 px-4 py-3 rounded-xl border-2 border-gray-200 text-center font-bold tracking-widest"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">Cancel</button>
                                    <button onClick={saveEdit} className="px-4 py-2 rounded-xl bg-petal-pink text-white font-bold text-sm">Save ✅</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-petal-blue/20 to-petal-purple/20 flex items-center justify-center text-3xl">
                                    {child.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-700">{child.name}</h3>
                                    <p className="text-sm text-gray-400">Age {child.age} • PIN: {child.pin_code}</p>
                                </div>
                                <button onClick={() => startEdit(child)} className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">✏️</button>
                                <button onClick={() => deleteChild(child.id)} className="px-3 py-2 rounded-xl bg-red-50 text-sm font-semibold text-red-500">🗑️</button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
