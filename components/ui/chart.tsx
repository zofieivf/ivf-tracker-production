"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Chart context for providing chart config
const ChartContext = React.createContext<{
  config: Record<string, any>
} | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={id} ref={ref} className={cn("flex aspect-video justify-center text-xs", className)} {...props}>
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: Record<string, any> }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          `[data-chart="${id}"] {`,
          ...colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.light ?? itemConfig.color
            return color ? `  --color-${key}: ${color};` : null
          }),
          `}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: any[]
    label?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelKey,
      nameKey,
      ...props
    },
    ref,
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
        {...props}
      >
        {!hideLabel && <div className="font-medium">{label}</div>}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.dataKey || "value"}`
            const itemConfig = config[key] || {}
            const indicatorColor = item.color || itemConfig.color || "#000"

            return (
              <div
                key={item.dataKey}
                className="flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
              >
                {!hideIndicator && (
                  <div
                    className="shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                    style={{
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                      width: "8px",
                      height: "8px",
                    }}
                  />
                )}
                <div className="flex w-full justify-between leading-none">
                  <div className="grid gap-1.5">
                    <span className="text-muted-foreground">{itemConfig.label || item.name}</span>
                  </div>
                  <span className="font-mono font-medium tabular-nums text-foreground">{item.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, hideIcon = false, payload, nameKey, ...props }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div ref={ref} className={cn("flex items-center justify-center gap-4", className)} {...props}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = config[key] || {}

        return (
          <div
            key={item.value}
            className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {!hideIcon && (
              <div
                className="shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                style={{
                  "--color-bg": item.color,
                  "--color-border": item.color,
                  width: "8px",
                  height: "8px",
                }}
              />
            )}
            {itemConfig?.label || item.value}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }
