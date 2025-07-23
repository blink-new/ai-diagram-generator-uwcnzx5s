import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-diagram-generator-uwcnzx5s',
  authRequired: true
})

// Add error handling for debugging
blink.auth.onAuthStateChanged((state) => {
  console.log('Auth state changed:', state)
})