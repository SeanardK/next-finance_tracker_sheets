"use client";

import ReactECharts from "echarts-for-react";
import type { SummaryMonth } from "../../types";

interface Props {
  data: SummaryMonth[];
  height?: number;
}

export function MonthlyChart({ data, height = 300 }: Props) {
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      top: "top",
      left: "left",
      data: ["Income", "Expense", "Net"],
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.month),
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Income",
        type: "bar",
        data: data.map((d) => d.income),
        itemStyle: { color: "#40c057" },
      },
      {
        name: "Expense",
        type: "bar",
        data: data.map((d) => d.expense),
        itemStyle: { color: "#fa5252" },
      },
      {
        name: "Net",
        type: "line",
        data: data.map((d) => d.net),
        itemStyle: { color: "#228be6" },
        lineStyle: { width: 2 },
        symbol: "circle",
      },
    ],
    grid: { containLabel: true, left: 16, right: 16, bottom: 16, top: 40 },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: "canvas" }}
      aria-label="Monthly income and expense bar chart"
    />
  );
}
