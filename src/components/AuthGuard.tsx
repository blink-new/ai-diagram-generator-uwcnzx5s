import { ReactNode } from 'react'
import { Button } from './ui/button'
import { blink } from '../blink/client'

interface AuthGuardProps {
  user: any
  children: ReactNode
}

export function AuthGuard({ user, children }: AuthGuardProps) {
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Diagram Generator</h1>
            <p className="text-slate-600">Transform complex topics into beautiful diagrams, mind maps, and flowcharts</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              Sign In to Get Started
            </Button>
            <p className="text-sm text-slate-500">
              Create diagrams from text prompts, upload datasets for charts, and convert PDFs to mind maps
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}