"use client";

import ReactECharts from "echarts-for-react";
import type { CategorySummary } from "../../types";

interface Props {
  data: CategorySummary[];
  height?: number;
}

export function CategoryChart({ data, height = 300 }: Props) {
  const top10 = data.slice(0, 10);

  const pieOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      type: "scroll",
    },
    series: [
      {
        name: "Category",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["35%", "50%"],
        data: top10.map((c) => ({
          value: Number(c.total.toFixed(2)),
          name: c.category,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0,0,0,0.5)",
          },
        },
        label: { show: false },
      },
    ],
  };

  return (
    <ReactECharts
      option={pieOption}
      style={{ height }}
      opts={{ renderer: "canvas" }}
      aria-label="Expense category pie chart"
    />
  );
}
