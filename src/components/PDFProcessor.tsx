import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Upload, FileText, Brain, Loader2, CheckCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { DiagramViewer } from './DiagramViewer'

export function PDFProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [generatedMindMap, setGeneratedMindMap] = useState(null)
  const [processingStep, setProcessingStep] = useState('')
  const { toast } = useToast()

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      })
      return
    }

    if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a PDF file smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setFile(uploadedFile)
    setExtractedText('')
    setGeneratedMindMap(null)
    setProgress(0)
  }, [toast])

  const handleProcessPDF = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setProcessingStep('Uploading PDF...')

    try {
      const user = await blink.auth.me()

      // Step 1: Upload PDF to storage
      setProgress(20)
      const { publicUrl } = await blink.storage.upload(file, `pdfs/${file.name}`, { upsert: true })
      
      // Step 2: Extract text from PDF
      setProcessingStep('Extracting text from PDF...')
      setProgress(40)
      
      const extractedContent = await blink.data.extractFromUrl(publicUrl)
      setExtractedText(extractedContent)
      
      if (!extractedContent || extractedContent.trim().length < 100) {
        throw new Error('Could not extract sufficient text from PDF')
      }

      // Step 3: Generate mind map
      setProcessingStep('Generating mind map with AI...')
      setProgress(70)

      const { text: mindMapCode } = await blink.ai.generateText({
        prompt: `Create a comprehensive mind map from the following PDF content. 
        
        Content: "${extractedContent.slice(0, 4000)}${extractedContent.length > 4000 ? '...(truncated)' : ''}"
        
        Generate a Mermaid mindmap syntax that:
        1. Captures the main topics and subtopics
        2. Shows relationships between concepts
        3. Includes key details and examples
        4. Is well-structured and easy to understand
        5. Uses appropriate hierarchy levels
        
        Make it comprehensive but not overwhelming. Focus on the most important concepts.
        Return only the Mermaid mindmap code without explanations.`,
        model: 'gpt-4o-mini'
      })

      // Step 4: Save to database
      setProcessingStep('Saving mind map...')
      setProgress(90)

      const mindMapData = {
        id: `mindmap_${Date.now()}`,
        userId: user.id,
        title: `Mind map from ${file.name}`,
        type: 'mindmap',
        prompt: `Mind map generated from PDF: ${file.name}`,
        diagramCode: mindMapCode,
        sourceFile: publicUrl,
        extractedText: extractedContent.slice(0, 2000), // Store first 2000 chars
        createdAt: new Date().toISOString()
      }

      await blink.db.diagrams.create(mindMapData)
      setGeneratedMindMap(mindMapData)

      setProgress(100)
      setProcessingStep('Complete!')

      toast({
        title: "PDF processed successfully!",
        description: "Your mind map has been generated from the PDF content"
      })

    } catch (error) {
      console.error('Error processing PDF:', error)
      toast({
        title: "PDF processing failed",
        description: error instanceof Error ? error.message : "Please try again with a different PDF",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => {
        setProcessingStep('')
        setProgress(0)
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-2 border-dashed border-slate-300 hover:border-purple-400 transition-colors">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload PDF Document</h3>
              <p className="text-slate-600 mb-4">
                Upload any PDF document and we'll extract the content to create a comprehensive mind map
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose PDF File
              </label>
            </div>
            {file && (
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Button */}
      {file && !generatedMindMap && (
        <Card>
          <CardContent className="p-6 text-center">
            <Button 
              onClick={handleProcessPDF}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate Mind Map
                </>
              )}
            </Button>
            <p className="text-sm text-slate-600 mt-3">
              This will extract text from your PDF and create an intelligent mind map
            </p>
          </CardContent>
        </Card>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Processing PDF</h3>
                <span className="text-sm text-slate-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-slate-600 flex items-center">
                {progress === 100 ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {processingStep}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Preview */}
      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Extracted Text Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-auto">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {extractedText.slice(0, 1000)}
                {extractedText.length > 1000 && (
                  <span className="text-slate-500">
                    ... ({extractedText.length - 1000} more characters)
                  </span>
                )}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Total characters extracted: {extractedText.length.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Mind Map */}
      {generatedMindMap && (
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <span>Generated Mind Map</span>
            </CardTitle>
            <p className="text-slate-600">{generatedMindMap.title}</p>
          </CardHeader>
          <CardContent>
            <DiagramViewer 
              diagramCode={generatedMindMap.diagramCode} 
              type={generatedMindMap.type}
            />
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for Best Results</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Upload PDFs with clear, readable text (avoid scanned images)</li>
            <li>• Academic papers, reports, and articles work best</li>
            <li>• Files under 5MB process faster</li>
            <li>• The AI will identify key concepts and create hierarchical relationships</li>
            <li>• You can edit the generated mind map after creation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}