import { format, parseISO } from "date-fns"
import { Calendar, FileText, MapPin, TestTube } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProcedureRecord } from "@/lib/types"

interface ProcedureCardProps {
  procedure: ProcedureRecord
}

export function ProcedureCard({ procedure }: ProcedureCardProps) {
  const displayName = procedure.procedureType === "Other" 
    ? procedure.customProcedureName || "Other Procedure"
    : procedure.procedureType

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(procedure.procedureDate), "MMMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Procedure
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {procedure.clinicName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {procedure.clinicName}
            </div>
          )}
          
          {procedure.results && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Results
              </div>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                {procedure.results}
              </p>
            </div>
          )}
          
          {procedure.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Notes
              </div>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                {procedure.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}