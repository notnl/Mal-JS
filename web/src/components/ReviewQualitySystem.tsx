import React, { useState, useEffect,useCallback } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import DropZoneComponent from './ui/dropzone'
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Filter,
  Star,
  Flag,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  Review,
  ReviewAnalysis,
  ReviewProcessingResult,
} from "../types/review";


const ReviewQualitySystem = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analyses, setAnalyses] = useState<Map<string, ReviewAnalysis>>(
    new Map(),
  );
  const [results, setResults] = useState<ReviewProcessingResult[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedTab, setSelectedTab] = useState("fileupload");

  const [filterAction, setFilterAction] = useState<
    "all" | "approve" | "flag" >("all");


  async function ProcessClick(curJS,fileName) {



      const resp = await fetch(`api/generate`, {
	 method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ JSContent: curJS }),
      });


	setIsProcessing(false)
     resp.json().then(
			(data) =>  { 

  			setResults(prevResults => {
					
				const reviewObj : Review = {
				id: '' + prevResults.length,
				javaFile : fileName	,
				content: '',
				timestamp: new Date()
				}

				const newR : ReviewProcessingResult  = 
				{
					review: reviewObj,
					action: (data['message'] == "0") ? "approve" : "flag"
				}


				return [...prevResults, newR]

				});
				

				
			})
    
/*export interface Review {
  id: string;
  javaFile: string;
  content: string;
  timestamp: Date;
  metadata?: {
    deviceInfo?: string;
    location?: {
      lat: number;
      lng: number;
    };
    visitDuration?: number;
    photos?: string[];
  };
}
*/

	/*
	export interface ReviewProcessingResult {
	  review: Review;
	  analysis: ReviewAnalysis;
	  action: "approve" | "flag" | "reject";
	  reason?: string;
	}
	*/

}

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "text-green-600";
      case "flag":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <CheckCircle className="h-4 w-4" />;
      case "flag":
        return <AlertTriangle className="h-4 w-4" />;
      case "reject":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
	setIsProcessing(true)
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
     reader.readAsText(file);

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')

      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result
		
	ProcessClick(binaryStr,file.name)
      }

    })
    
  }, [])

  const filteredResults = results.filter(
    (result) => filterAction === "all" || result.action === filterAction,
  );

  const summary = {
    total: results.length,
    approved: results.filter((r) => r.action === "approve").length,
    flagged: results.filter((r) => r.action === "flag").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                Malicious Javascript Detection System
              </h1>
              <p className="text-gray-600 mt-2">
                ML-powered system for Malicious Javascript detection
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Reviews
                  </p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Benign</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.approved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.flagged}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">

            <TabsTrigger value="fileupload">File Upload</TabsTrigger>
            <TabsTrigger value="reviews">Review Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Review Results
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filter">Filter:</Label>
                    <select
                      id="filter"
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value as any)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All Reviews</option>
                      <option value="approve">Approved</option>
                      <option value="flag">Flagged</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredResults.map((result) => {

                      return (
                        <Card
                          key={result.review.id}
                          className="border-l-4 border-l-gray-200"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Review Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {result.review.javaFile}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {result.review.timestamp.toLocaleDateString()}
																		
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${getActionColor(result.action)}`}
                                >
                                  {getActionIcon(result.action)}
                                  <span className="text-sm font-medium capitalize">
                                    {result.action}
                                  </span>
                                </div>
                              </div>

                              {/* Review Content */}
                              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                                {result.review.content}
                              </p>


                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="fileupload" className="space-y-4">

	<div >
            <Card className="h-[50vh]">

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
			Upload 
                </CardTitle>
                <CardDescription>
			Upload your javascript files here!
                </CardDescription>
              </CardHeader>

             

<div
  className={`
  `}
>
              {isProcessing ? (
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white 
    flex justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors
    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
    disabled:pointer-events-none disabled:opacity-50
    shadow h-9 px-4 
		${isProcessing ? 'bg-black text-white items-center opacity-50' : 'opacity-0'}
		`}>
				
		</div>
              ) : (
	      <DropZoneComponent  onDrop={onDrop}/>
              )}

            </div>

		


            </Card>

	</div>		
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Approval Rate</span>
                      <span className="font-medium">
                        {summary.total > 0
                          ? Math.round((summary.approved / summary.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Flag Rate</span>
                      <span className="font-medium">
                        {summary.total > 0
                          ? Math.round((summary.flagged / summary.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReviewQualitySystem;
