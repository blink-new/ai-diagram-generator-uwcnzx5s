import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Upload, FileSpreadsheet, BarChart3, PieChart, TrendingUp, Loader2 } from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { DiagramViewer } from './DiagramViewer'

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
  { value: 'line', label: 'Line Chart', icon: TrendingUp, description: 'Display trends over time' },
  { value: 'scatter', label: 'Scatter Plot', icon: BarChart3, description: 'Show relationships between variables' }
]

export function DatasetUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [chartType, setChartType] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState({ x: '', y: '', label: '' })
  const [generatedChart, setGeneratedChart] = useState(null)
  const { toast } = useToast()

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.match(/\.(csv|xlsx|json)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, or JSON file",
        variant: "destructive"
      })
      return
    }

    setFile(uploadedFile)
    setIsProcessing(true)

    try {
      // Convert file to text for processing
      const text = await uploadedFile.text()
      
      // Parse CSV data (simple implementation)
      if (uploadedFile.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })

        setColumns(headers)
        setParsedData(data)
        
        toast({
          title: "File uploaded successfully",
          description: `Parsed ${data.length} rows with ${headers.length} columns`
        })
      } else {
        toast({
          title: "File format not yet supported",
          description: "Currently only CSV files are supported. Excel and JSON support coming soon!",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Error parsing file:', error)
      toast({
        title: "Failed to parse file",
        description: "Please check your file format and try again",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const handleGenerateChart = async () => {
    if (!parsedData.length || !chartType || !selectedColumns.x || !selectedColumns.y) {
      toast({
        title: "Missing information",
        description: "Please select chart type and required columns",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const user = await blink.auth.me()

      // Prepare data for chart generation
      const chartData = parsedData.map(row => ({
        x: row[selectedColumns.x],
        y: parseFloat(row[selectedColumns.y]) || 0,
        label: selectedColumns.label ? row[selectedColumns.label] : row[selectedColumns.x]
      })).filter(item => !isNaN(item.y))

      // Generate chart code using AI
      const { text: chartCode } = await blink.ai.generateText({
        prompt: `Create a ${chartType} chart using the following data:
        
        Data: ${JSON.stringify(chartData.slice(0, 20))} ${chartData.length > 20 ? '...(truncated)' : ''}
        
        X-axis: ${selectedColumns.x}
        Y-axis: ${selectedColumns.y}
        ${selectedColumns.label ? `Labels: ${selectedColumns.label}` : ''}
        
        Generate appropriate Mermaid chart syntax or data visualization code.
        Make it visually appealing and informative.
        Return only the chart code without explanations.`,
        model: 'gpt-4o-mini'
      })

      // Save to database
      const chartDiagram = {
        id: `chart_${Date.now()}`,
        userId: user.id,
        title: `${chartType} chart from ${file?.name}`,
        type: chartType,
        prompt: `Chart generated from dataset: ${file?.name}`,
        diagramCode: chartCode,
        sourceData: JSON.stringify(chartData),
        createdAt: new Date().toISOString()
      }

      await blink.db.diagrams.create(chartDiagram)
      setGeneratedChart(chartDiagram)

      toast({
        title: "Chart generated successfully!",
        description: "Your data visualization is ready"
      })

    } catch (error) {
      console.error('Error generating chart:', error)
      toast({
        title: "Chart generation failed",
        description: "Please try again with different settings",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Your Dataset</h3>
              <p className="text-slate-600 mb-4">
                Support for CSV, Excel, and JSON files. Upload your data to create beautiful charts.
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="max-w-sm mx-auto"
                disabled={isProcessing}
              />
            </div>
            {file && (
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                <FileSpreadsheet className="w-4 h-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Configure Your Chart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chart Type Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Select Chart Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CHART_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={chartType === type.value ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setChartType(type.value)}
                    >
                      <Icon className="w-6 h-6" />
                      <div className="text-center">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-slate-500">{type.description}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Column Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="x-column">X-Axis Column</Label>
                <Select value={selectedColumns.x} onValueChange={(value) => 
                  setSelectedColumns(prev => ({ ...prev, x: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X-axis data" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="y-column">Y-Axis Column</Label>
                <Select value={selectedColumns.y} onValueChange={(value) => 
                  setSelectedColumns(prev => ({ ...prev, y: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y-axis data" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="label-column">Label Column (Optional)</Label>
                <Select value={selectedColumns.label} onValueChange={(value) => 
                  setSelectedColumns(prev => ({ ...prev, label: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select labels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {columns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Preview */}
            <div>
              <Label className="text-base font-medium mb-3 block">Data Preview</Label>
              <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-auto">
                <div className="text-sm">
                  <div className="font-medium text-slate-700 mb-2">
                    {parsedData.length} rows, {columns.length} columns
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {parsedData.slice(0, 6).map((row, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        {Object.entries(row).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-600">{key}:</span>
                            <span className="text-slate-800 truncate ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateChart}
              disabled={isProcessing || !chartType || !selectedColumns.x || !selectedColumns.y}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Chart...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Generate Chart
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Chart */}
      {generatedChart && (
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Generated Chart</CardTitle>
            <p className="text-slate-600">{generatedChart.title}</p>
          </CardHeader>
          <CardContent>
            <DiagramViewer 
              diagramCode={generatedChart.diagramCode} 
              type={generatedChart.type}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}