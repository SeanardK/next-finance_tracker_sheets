"use client";

import { Paper, Text, useMantineColorScheme } from "@mantine/core";
import ReactECharts from "echarts-for-react";

interface AllocationItem {
  name: string;
  value: number;
  pct: number;
}

interface Props {
  title: string;
  data: AllocationItem[];
  currency?: string;
}

export function PortfolioAllocationChart({
  title,
  data,
  currency = "IDR",
}: Props) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}<br/>${currency} ${params.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}<br/>${params.percent.toFixed(1)}%`,
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: {
        color: isDark ? "#c1c2c5" : "#495057",
        fontSize: 12,
      },
    },
    series: [
      {
        name: title,
        type: "pie",
        radius: ["40%", "70%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? "#1a1b1e" : "#ffffff",
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: "bold" },
        },
        data: data.map((d) => ({ name: d.name, value: Math.round(d.value) })),
      },
    ],
  };

  if (data.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text fw={600} mb="sm">
          {title}
        </Text>
        <Text c="dimmed" ta="center" py="xl" size="sm">
          No data
        </Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Text fw={600} mb="sm">
        {title}
      </Text>
      <ReactECharts
        option={option}
        style={{ height: 220 }}
        notMerge
        theme={isDark ? "dark" : undefined}
      />
    </Paper>
  );
}
