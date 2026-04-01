'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Child } from '@/lib/types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    children: Child[]
    activeChild: Child | null
    loading: boolean
    signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: Error | null }>
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    setActiveChild: (child: Child | null) => void
    refreshChildren: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children: childrenProp }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [childProfiles, setChildProfiles] = useState<Child[]>([])
    const [activeChild, setActiveChild] = useState<Child | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (data) setProfile(data as Profile)
        return data as Profile | null
    }, [supabase])

    const fetchChildren = useCallback(async (parentId: string) => {
        const { data, error } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true })
        if (error) {
            console.error('Error fetching children:', error)
        }
        if (data) setChildProfiles(data as Child[])
    }, [supabase])

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id)
    }, [user, fetchProfile])

    const refreshChildren = useCallback(async () => {
        if (user) await fetchChildren(user.id)
    }, [user, fetchChildren])

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            setSession(currentSession)
            setUser(currentSession?.user ?? null)

            if (currentSession?.user) {
                const prof = await fetchProfile(currentSession.user.id)
                if (prof?.role === 'parent' || prof?.role === 'admin') {
                    await fetchChildren(currentSession.user.id)
                }
            }
            setLoading(false)
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)
                if (newSession?.user) {
                    const prof = await fetchProfile(newSession.user.id)
                    if (prof?.role === 'parent' || prof?.role === 'admin') {
                        await fetchChildren(newSession.user.id)
                    }
                } else {
                    setProfile(null)
                    setChildProfiles([])
                    setActiveChild(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase, fetchProfile, fetchChildren])

    const signUp = async (email: string, password: string, fullName: string, role = 'parent') => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role }
            }
        })
        return { error: error as Error | null }
    }

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error as Error | null }
    }

    const signOut = async () => {
        // Clear local state immediately
        setUser(null)
        setProfile(null)
        setSession(null)
        setChildProfiles([])
        setActiveChild(null)
        // Navigate to server-side signout route — it clears cookies in the
        // response and redirects to /login, avoiding the middleware race condition
        // where stale cookies would redirect the user back to the dashboard.
        // Important: do NOT call supabase.auth.signOut() here — that would clear
        // cookies before the navigation, causing middleware to see no user and
        // potentially redirect before the API route can execute.
        window.location.href = '/api/auth/signout'
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            children: childProfiles,
            activeChild,
            loading,
            signUp,
            signIn,
            signOut,
            setActiveChild,
            refreshChildren,
            refreshProfile,
        }}>
            {childrenProp}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
