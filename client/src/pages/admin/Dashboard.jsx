import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Spin,
  message,
  Progress,
} from "antd";
import {
  EyeOutlined,
  HeartOutlined,
  CommentOutlined,
  HistoryOutlined,
  BookOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatNumber } from "../../utils/helpers.js";

const { Title, Text } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chapterColumns = [
    {
      title: "章节标题",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.storyline_title}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "浏览量",
      dataIndex: "view_count",
      key: "view_count",
      render: (v) => formatNumber(v),
      sorter: (a, b) => a.view_count - b.view_count,
    },
    {
      title: "献花数",
      dataIndex: "flower_count",
      key: "flower_count",
      render: (v) => formatNumber(v),
      sorter: (a, b) => a.flower_count - b.flower_count,
    },
    {
      title: "留言数",
      dataIndex: "comment_count",
      key: "comment_count",
      render: (v) => formatNumber(v),
      sorter: (a, b) => a.comment_count - b.comment_count,
    },
  ];

  const artifactColumns = [
    {
      title: "文物名称",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      render: (text) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: "浏览量",
      dataIndex: "view_count",
      key: "view_count",
      render: (v) => formatNumber(v),
      sorter: (a, b) => a.view_count - b.view_count,
    },
  ];

  const figureColumns = [
    {
      title: "人物姓名",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "职务",
      dataIndex: "role",
      key: "role",
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "浏览量",
      dataIndex: "view_count",
      key: "view_count",
      render: (v) => formatNumber(v),
      sorter: (a, b) => a.view_count - b.view_count,
    },
  ];

  const storylineColumns = [
    {
      title: "故事线",
      dataIndex: "storyline_title",
      key: "storyline_title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "章节数",
      dataIndex: "chapter_count",
      key: "chapter_count",
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "总浏览量",
      dataIndex: "total_views",
      key: "total_views",
      render: (v, record) => {
        const max = Math.max(
          ...(stats?.chapterStats?.map((s) => s.total_views) || [1]),
        );
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={Math.round((v / max) * 100)}
              showInfo={false}
              size="small"
              style={{ width: 100 }}
            />
            <Text>{formatNumber(v)}</Text>
          </div>
        );
      },
      sorter: (a, b) => a.total_views - b.total_views,
    },
    {
      title: "总献花",
      dataIndex: "total_flowers",
      key: "total_flowers",
      render: (v) => formatNumber(v),
    },
    {
      title: "总留言",
      dataIndex: "total_comments",
      key: "total_comments",
      render: (v) => formatNumber(v),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        数据看板
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <HistoryOutlined
                    style={{ color: "#c41e3a", marginRight: 4 }}
                  />{" "}
                  故事线
                </span>
              }
              value={stats.overview.totalStorylines}
              valueStyle={{ color: "#c41e3a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <BookOutlined style={{ color: "#1890ff", marginRight: 4 }} />{" "}
                  章节
                </span>
              }
              value={stats.overview.totalChapters}
              suffix={`/ ${stats.overview.publishedChapters} 已发布`}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <AppstoreOutlined
                    style={{ color: "#faad14", marginRight: 4 }}
                  />{" "}
                  文物
                </span>
              }
              value={stats.overview.totalArtifacts}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <TeamOutlined style={{ color: "#52c41a", marginRight: 4 }} />{" "}
                  人物
                </span>
              }
              value={stats.overview.totalFigures}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <EyeOutlined style={{ color: "#722ed1", marginRight: 4 }} />{" "}
                  总浏览量
                </span>
              }
              value={stats.overview.totalViews}
              formatter={formatNumber}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <HeartOutlined style={{ color: "#eb2f96", marginRight: 4 }} />{" "}
                  总献花
                </span>
              }
              value={stats.overview.totalFlowers}
              formatter={formatNumber}
              valueStyle={{ color: "#eb2f96" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={
                <span>
                  <CommentOutlined
                    style={{ color: "#13c2c2", marginRight: 4 }}
                  />{" "}
                  留言审核
                </span>
              }
              value={stats.overview.pendingComments}
              suffix={`/ ${stats.overview.totalComments} 总留言`}
              valueStyle={{
                color:
                  stats.overview.pendingComments > 0 ? "#faad14" : "#52c41a",
              }}
            />
            {stats.overview.pendingComments > 0 && (
              <Tag color="warning" style={{ marginTop: 8 }}>
                <ClockCircleOutlined /> 有 {stats.overview.pendingComments}{" "}
                条留言待审核
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            style={{ borderRadius: 8 }}
            title={
              <Text strong>
                <EyeOutlined style={{ color: "#1890ff" }} /> 热门章节 TOP 10
              </Text>
            }
          >
            <Table
              dataSource={stats.topChapters}
              columns={chapterColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            style={{ borderRadius: 8, marginBottom: 16 }}
            title={
              <Text strong>
                <AppstoreOutlined style={{ color: "#faad14" }} /> 热门文物 TOP
                10
              </Text>
            }
          >
            <Table
              dataSource={stats.topArtifacts}
              columns={artifactColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
          <Card
            style={{ borderRadius: 8 }}
            title={
              <Text strong>
                <TeamOutlined style={{ color: "#52c41a" }} /> 热门人物 TOP 10
              </Text>
            }
          >
            <Table
              dataSource={stats.topFigures}
              columns={figureColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            style={{ borderRadius: 8 }}
            title={
              <Text strong>
                <HistoryOutlined style={{ color: "#c41e3a" }} /> 按故事线统计
              </Text>
            }
          >
            <Table
              dataSource={stats.chapterStats}
              columns={storylineColumns}
              rowKey="storyline_id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
