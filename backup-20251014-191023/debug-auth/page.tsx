"use client"

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/src/lib/supabaseClient'
import { uploadInit } from '@/lib/api/client'

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...')
  const [user, setUser] = useState<any>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkAuthStatus = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        addResult(`❌ Session check error: ${error.message}`)
        setAuthStatus('Error')
        return
      }

      if (session) {
        addResult(`✅ User authenticated: ${session.user.email}`)
        setUser(session.user)
        setAuthStatus('Authenticated')

        // 检查用户是否在数据库中
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'GET',
          credentials: 'include'
        })

        if (syncResponse.ok) {
          const data = await syncResponse.json()
          addResult(`✅ User synced to database: ${data.user.email}`)
        } else {
          addResult(`❌ User sync failed: ${syncResponse.status}`)
        }
      } else {
        addResult('❌ No session found')
        setAuthStatus('Not Authenticated')
      }
    } catch (error) {
      addResult(`❌ Auth check error: ${error}`)
      setAuthStatus('Error')
    }
  }

  const testUploadAPI = async () => {
    addResult('🧪 Testing upload API...')

    try {
      const result = await uploadInit({
        filename: 'debug-test.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1024
      })

      addResult(`✅ Upload API success! Upload ID: ${result.uploadId}`)
    } catch (error: any) {
      addResult(`❌ Upload API failed: ${error.message} (Status: ${error.status})`)

      if (error.status === 401) {
        addResult('💡 This is a 401 authentication error - token not being sent properly')
      }
    }
  }

  const testDirectAPI = async () => {
    addResult('🧪 Testing direct API call with manual token...')

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addResult('❌ No access token available')
        return
      }

      const response = await fetch('/api/uploads/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          filename: 'direct-test.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 1024
        })
      })

      if (response.ok) {
        const data = await response.json()
        addResult(`✅ Direct API success! Upload ID: ${data.uploadId}`)
      } else {
        const error = await response.json()
        addResult(`❌ Direct API failed: ${error.error} (Status: ${response.status})`)
      }
    } catch (error: any) {
      addResult(`❌ Direct API error: ${error.message}`)
    }
  }

  const signIn = async () => {
    addResult('🔗 Initiating Google sign in...')
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })

    if (error) {
      addResult(`❌ Sign in error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Authentication Debug Page</h1>

        {/* Auth Status */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p className="mb-2">Status: <span className={`font-bold ${
            authStatus === 'Authenticated' ? 'text-green-400' :
            authStatus === 'Not Authenticated' ? 'text-red-400' : 'text-yellow-400'
          }`}>{authStatus}</span></p>
          {user && (
            <div className="text-sm text-gray-300">
              <p>Email: {user.email}</p>
              <p>ID: {user.id}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={checkAuthStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Check Auth Status
            </button>
            {authStatus !== 'Authenticated' && (
              <button
                onClick={signIn}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Sign In with Google
              </button>
            )}
            <button
              onClick={testUploadAPI}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
              disabled={authStatus !== 'Authenticated'}
            >
              Test Upload API
            </button>
            <button
              onClick={testDirectAPI}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
              disabled={authStatus !== 'Authenticated'}
            >
              Test Direct API
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400">No tests run yet. Click the buttons above to start testing.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono p-2 bg-gray-700 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "Check Auth Status" to see current authentication state</li>
            <li>If not authenticated, click "Sign In with Google"</li>
            <li>After signing in, click "Test Upload API" to verify token is being sent</li>
            <li>Use "Test Direct API" to bypass the API client and test manual token handling</li>
          </ol>
        </div>
      </div>
    </div>
  )
}