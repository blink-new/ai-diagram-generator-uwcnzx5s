import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Search, 
  Calendar, 
  Eye, 
  Edit3, 
  Download, 
  Trash2, 
  FileText, 
  BarChart3, 
  Brain,
  Filter
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { DiagramViewer } from './DiagramViewer'

const DIAGRAM_TYPE_ICONS = {
  flowchart: FileText,
  mindmap: Brain,
  sequence: FileText,
  class: FileText,
  gantt: Calendar,
  pie: BarChart3,
  bar: BarChart3,
  line: BarChart3,
  network: FileText
}

export function DiagramHistory() {
  const [diagrams, setDiagrams] = useState([])
  const [filteredDiagrams, setFilteredDiagrams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedDiagram, setSelectedDiagram] = useState(null)
  const { toast } = useToast()

  const loadDiagrams = useCallback(async () => {
    setIsLoading(true)
    try {
      const user = await blink.auth.me()
      const userDiagrams = await blink.db.diagrams.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50
      })
      setDiagrams(userDiagrams)
    } catch (error) {
      console.error('Error loading diagrams:', error)
      toast({
        title: "Failed to load diagrams",
        description: "Please try refreshing the page",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const filterDiagrams = useCallback(() => {
    let filtered = diagrams

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(diagram => 
        diagram.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diagram.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(diagram => diagram.type === filterType)
    }

    setFilteredDiagrams(filtered)
  }, [diagrams, searchTerm, filterType])

  useEffect(() => {
    loadDiagrams()
  }, [loadDiagrams])

  useEffect(() => {
    filterDiagrams()
  }, [filterDiagrams])

  const handleDeleteDiagram = async (diagramId: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) return

    try {
      await blink.db.diagrams.delete(diagramId)
      setDiagrams(prev => prev.filter(d => d.id !== diagramId))
      if (selectedDiagram?.id === diagramId) {
        setSelectedDiagram(null)
      }
      toast({
        title: "Diagram deleted",
        description: "The diagram has been removed from your history"
      })
    } catch (error) {
      console.error('Error deleting diagram:', error)
      toast({
        title: "Failed to delete diagram",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    const colors = {
      flowchart: 'bg-blue-100 text-blue-800',
      mindmap: 'bg-purple-100 text-purple-800',
      sequence: 'bg-green-100 text-green-800',
      class: 'bg-yellow-100 text-yellow-800',
      gantt: 'bg-orange-100 text-orange-800',
      pie: 'bg-pink-100 text-pink-800',
      bar: 'bg-indigo-100 text-indigo-800',
      line: 'bg-teal-100 text-teal-800',
      network: 'bg-red-100 text-red-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your diagrams...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search diagrams by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="flowchart">Flowcharts</SelectItem>
                  <SelectItem value="mindmap">Mind Maps</SelectItem>
                  <SelectItem value="sequence">Sequence Diagrams</SelectItem>
                  <SelectItem value="class">Class Diagrams</SelectItem>
                  <SelectItem value="gantt">Gantt Charts</SelectItem>
                  <SelectItem value="pie">Pie Charts</SelectItem>
                  <SelectItem value="bar">Bar Charts</SelectItem>
                  <SelectItem value="line">Line Charts</SelectItem>
                  <SelectItem value="network">Network Diagrams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredDiagrams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {diagrams.length === 0 ? 'No diagrams yet' : 'No matching diagrams'}
            </h3>
            <p className="text-slate-600">
              {diagrams.length === 0 
                ? 'Create your first diagram using the tabs above'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagram List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Your Diagrams ({filteredDiagrams.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredDiagrams.map((diagram) => {
                const IconComponent = DIAGRAM_TYPE_ICONS[diagram.type] || FileText
                return (
                  <Card 
                    key={diagram.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDiagram?.id === diagram.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedDiagram(diagram)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <IconComponent className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            <h4 className="font-medium text-slate-800 truncate">
                              {diagram.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTypeColor(diagram.type)}>
                              {diagram.type}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {formatDate(diagram.createdAt)}
                            </span>
                          </div>
                          {diagram.prompt && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {diagram.prompt}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDiagram(diagram)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Implement edit functionality
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDiagram(diagram.id)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Diagram Viewer */}
          <div className="space-y-4">
            {selectedDiagram ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Preview</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{selectedDiagram.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(selectedDiagram.type)}>
                        {selectedDiagram.type}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {formatDate(selectedDiagram.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DiagramViewer 
                      diagramCode={selectedDiagram.diagramCode} 
                      type={selectedDiagram.type}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Select a diagram to preview
                  </h3>
                  <p className="text-slate-600">
                    Click on any diagram from the list to view it here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}