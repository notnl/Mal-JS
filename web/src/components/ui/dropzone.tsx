import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import {Card,CardContent} from './card'
import {MAX_FILE_SIZE} from '@/constants'

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
  Maximize,
} from "lucide-react";

export default function DropZoneComponent({onDrop}) {


  const {getRootProps, getInputProps} = useDropzone({onDrop, maxSize:MAX_FILE_SIZE})

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
        <div className=" w-full h-full">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center h-full">
		  <div className="flex flex-col items-center">
		    <p className="text-4xl font-bold text-gray-800 text-center">
		      Drop Files 
		    </p>
		    <Maximize className="h-12 w-12 text-blue-600 mt-4" />
		  </div>
              </div>
            </CardContent>
          </Card>
	  </div>
    </div>
  )
}
