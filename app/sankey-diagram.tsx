import {
  Dimensions,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { Application } from "../types";
import { useApplications } from "../context/ApplicationContext";
import { useEffect, useMemo, useState } from "react";
import WebView from "react-native-webview";

const { width, height } = Dimensions.get("window");

const CHANNEL_COLORS: { [key: string]: string } = {
  LinkedIn: "rgba(0, 119, 181, 0.6)",
  "Company Website": "rgba(220, 220, 220, 0.8)",
  Referral: "rgba(52, 168, 83, 0.6)",
  "Job Board": "rgba(251, 188, 5, 0.6)",
  Networking: "rgba(234, 67, 53, 0.6)",
  Other: "rgba(150, 150, 150, 0.6)",
  Unknown: "rgba(100, 100, 100, 0.3)",
};

type SankeyNode = { label: string; rawLabel: string; count: number };
type SankeyLink = {
  source: number;
  target: number;
  value: number;
  channel: string;
};

const transformDataForSankey = (
  applications: Application[]
): {
  nodes: SankeyNode[];
  links: SankeyLink[];
} => {
  const uniqueStageNames = new Set<string>();
  const channelLinkCounts = new Map<string, Map<string, number>>();
  const stageApplicationCounts = new Map<string, number>();

  applications.forEach((job) => {
    const sortedStages = [...job.stages].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const jobChannel = job.channel || "Unknown";
    if (!channelLinkCounts.has(jobChannel)) {
      channelLinkCounts.set(jobChannel, new Map<string, number>());
    }
    const currentChannelLinks = channelLinkCounts.get(jobChannel)!;

    const stagesInThisApplication = new Set<string>();

    for (let i = 0; i < sortedStages.length; i++) {
      const currentStageName = sortedStages[i].name;
      uniqueStageNames.add(currentStageName);
      stagesInThisApplication.add(currentStageName);

      if (i < sortedStages.length - 1) {
        const nextStageName = sortedStages[i + 1].name;
        const linkKey = `${currentStageName}->${nextStageName}`;
        currentChannelLinks.set(
          linkKey,
          (currentChannelLinks.get(linkKey) || 0) + 1
        );
      }
    }

    stagesInThisApplication.forEach((stageName) => {
      stageApplicationCounts.set(
        stageName,
        (stageApplicationCounts.get(stageName) || 0) + 1
      );
    });
  });

  const nodes: SankeyNode[] = [];
  const nodeMap = new Map<string, number>();
  const sortedUniqueStageNames = Array.from(uniqueStageNames).sort();

  sortedUniqueStageNames.forEach((stageName) => {
    const count = stageApplicationCounts.get(stageName) || 0;
    nodeMap.set(stageName, nodes.length);
    nodes.push({
      label: `${stageName}: ${count}`,
      rawLabel: stageName,
      count: count,
    });
  });

  const links: SankeyLink[] = [];
  channelLinkCounts.forEach((linkMapForChannel, channelName) => {
    linkMapForChannel.forEach((count, linkKey) => {
      const [sourceName, targetName] = linkKey.split("->");
      const sourceIndex = nodeMap.get(sourceName);
      const targetIndex = nodeMap.get(targetName);

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        links.push({
          source: sourceIndex,
          target: targetIndex,
          value: count,
          channel: channelName,
        });
      }
    });
  });

  return { nodes, links };
};

const SankeyDiagramScreen = () => {
  const { applications, loading } = useApplications();
  const [sankeyHtml, setSankeyHtml] = useState<string | null>(null);

  const sankeyData = useMemo(() => {
    return transformDataForSankey(applications);
  }, [applications]);

  useEffect(() => {
    if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
      setSankeyHtml(null);
      return;
    }

    const { nodes, links } = sankeyData;
    const linkColors = links.map((link) => {
      return CHANNEL_COLORS[link.channel] || "rgba(100, 100, 100, 0.2)";
    });

    const plotlyConfig = {
      data: [
        {
          type: "sankey",
          orientation: "h",
          node: {
            pad: 15,
            thickness: 30,
            line: {
              color: "black",
              width: 0.5,
            },
            label: nodes.map((node) => `${node.rawLabel}: ${node.count}`),
            color: "blue",
          },
          link: {
            source: links.map((link) => link.source),
            target: links.map((link) => link.target),
            value: links.map((link) => link.value),
            color: linkColors,
          },
        },
      ],
      layout: {
        title: "Application Flow By Channel",
        font: {
          size: 10,
        },
        height: height * 0.9,
        width: width * 0.95,
      },
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body { margin: 0; padding: 0; overflow: hidden; background-color: #f8f8f8; }
            #graph { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
        </style>
        </head>
        <body>
        <div id="graph"></div>
        <script> const plotlyConfig = ${JSON.stringify(plotlyConfig)};
        Plotly.newPlot('graph', plotlyConfig.data, plotlyConfig.layout, {responsive: true});
        </script>
        </body>
        </html>`;

    setSankeyHtml(htmlContent);
  }, [sankeyData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!sankeyHtml) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No sufficient data to generate Sankey Map
        </Text>
        <Text style={styles.noDataSubtext}>
          Add applications with multiple stages to see the flow
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: sankeyHtml }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        scalesPageToFit={true}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#555",
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: "center",
    color: "#777",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SankeyDiagramScreen;
