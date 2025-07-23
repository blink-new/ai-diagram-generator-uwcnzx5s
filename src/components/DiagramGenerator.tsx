import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { TextPromptGenerator } from './TextPromptGenerator'
import { DatasetUploader } from './DatasetUploader'
import { PDFProcessor } from './PDFProcessor'
import { DiagramHistory } from './DiagramHistory'
import { FileText, BarChart3, Upload, History } from 'lucide-react'

export function DiagramGenerator() {
  const [activeTab, setActiveTab] = useState('text')

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Create Beautiful Diagrams with AI
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Transform complex topics into clear, visual diagrams. Generate flowcharts, mind maps, 
          and charts from text prompts, datasets, or PDF documents.
        </p>
      </div>

      {/* Main Interface */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl text-center text-slate-800">
            Choose Your Creation Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger 
                value="text" 
                className="flex items-center space-x-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Text Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dataset" 
                className="flex items-center space-x-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dataset</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pdf" 
                className="flex items-center space-x-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>PDF Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center space-x-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-0">
              <TextPromptGenerator />
            </TabsContent>

            <TabsContent value="dataset" className="mt-0">
              <DatasetUploader />
            </TabsContent>

            <TabsContent value="pdf" className="mt-0">
              <PDFProcessor />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <DiagramHistory />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}