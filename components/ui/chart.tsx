"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, any>
    children: React.ComponentProps<"div">["children"]
  }
>(({ className, config, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("w-full h-[350px]", className)} {...props}>
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(config)
            .map(([key, value]) => `--color-${key}: ${value.color || value};`)
            .join(" "),
        }}
      />
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ active, payload, label, content: Content, ...props }: any) => {
  if (Content) {
    return <Content active={active} payload={payload} label={label} {...props} />
  }

  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }

  return null
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: Array<{
      color: string
      dataKey: string
      name: string
      value: number | string
      payload: any
    }>
    label?: string
    labelFormatter?: (label: string, payload: any) => string
    formatter?: (value: number | string, name: string) => [string, string]
  }
>(({ className, active, payload, label, labelFormatter, formatter, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label || "", payload) : label

  return (
    <div ref={ref} className={cn("bg-background border rounded-lg shadow-lg p-3 text-sm", className)} {...props}>
      {formattedLabel && <p className="font-medium mb-1">{formattedLabel}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const formattedValue = formatter
            ? formatter(entry.value, entry.name || entry.dataKey)
            : [entry.value, entry.name || entry.dataKey]

          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{formattedValue[1]}:</span>
              <span className="font-medium">{formattedValue[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
