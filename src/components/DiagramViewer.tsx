import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

interface DiagramViewerProps {
  diagramCode: string
  type: string
}

export function DiagramViewer({ diagramCode, type }: DiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (!diagramCode || !containerRef.current) return

    const renderDiagram = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          mindmap: {
            useMaxWidth: true
          },
          sequence: {
            useMaxWidth: true,
            showSequenceNumbers: true
          },
          gantt: {
            useMaxWidth: true,
            fontSize: 12
          }
        })

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Generate unique ID for this diagram
        const diagramId = `diagram-${Date.now()}`
        
        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagramCode)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          
          // Apply zoom
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.transform = `scale(${zoom})`
            svgElement.style.transformOrigin = 'top left'
            svgElement.style.maxWidth = 'none'
            svgElement.style.height = 'auto'
          }
        }

      } catch (err) {
        console.error('❌ Mermaid rendering error:', err)
        console.log('📝 Diagram code that failed:', diagramCode)
        setError(`Failed to render diagram: ${err instanceof Error ? err.message : 'Unknown error'}`)
        
        // Try to render a simple fallback diagram
        try {
          const fallbackCode = `flowchart TD
    A[Diagram Rendering Failed] --> B[Raw Code Below]
    B --> C[Please Check Syntax]`
          
          const fallbackId = `fallback-${Date.now()}`
          const { svg: fallbackSvg } = await mermaid.render(fallbackId, fallbackCode)
          
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="space-y-4">
                <div class="text-center text-amber-600 p-4 bg-amber-50 rounded-lg">
                  <p class="font-medium">Diagram rendering failed, showing fallback</p>
                </div>
                ${fallbackSvg}
                <details class="bg-slate-100 rounded-lg p-4">
                  <summary class="cursor-pointer font-medium text-slate-800 mb-2">
                    View original diagram code
                  </summary>
                  <pre class="text-sm text-slate-600 whitespace-pre-wrap overflow-auto">${diagramCode}</pre>
                </details>
              </div>
            `
          }
        } catch (fallbackErr) {
          // If even fallback fails, show raw code
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="p-4 bg-red-50 rounded-lg">
                <h4 class="font-medium text-red-800 mb-2">Rendering Error</h4>
                <p class="text-red-600 mb-4">Unable to render diagram. Raw code:</p>
                <pre class="text-sm text-slate-600 whitespace-pre-wrap bg-white p-3 rounded border overflow-auto">${diagramCode}</pre>
              </div>
            `
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [diagramCode, zoom])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Rendering diagram...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleFullscreen}>
          <Maximize2 className="w-4 h-4 mr-2" />
          Fullscreen
        </Button>
      </div>

      {/* Diagram Container */}
      <Card className="p-6 bg-white min-h-[400px] overflow-auto">
        {error ? (
          <div className="text-center text-red-600 p-8">
            <p className="mb-4">{error}</p>
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-slate-600 mb-2">
                View diagram code
              </summary>
              <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto">
                {diagramCode}
              </pre>
            </details>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="diagram-container flex justify-center items-start"
            style={{ minHeight: '300px' }}
          />
        )}
      </Card>
    </div>
  )
}