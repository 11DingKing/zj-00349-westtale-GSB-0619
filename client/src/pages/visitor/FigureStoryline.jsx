import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Tag,
  Timeline,
  Empty,
  Spin,
  message,
  Breadcrumb,
  Avatar,
} from "antd";
import {
  HistoryOutlined,
  LeftOutlined,
  PlayCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatDate } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;

function FigureStoryline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storyline, setStoryline] = useState(null);
  const [figure, setFigure] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [figureData, storylineData] = await Promise.all([
        publicApi.getFigure(id),
        publicApi.getFigureStoryline(id),
      ]);
      setFigure(figureData);
      setStoryline(storylineData);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!storyline || storyline.timeline.length === 0) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="暂无相关故事线" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
          color: "#fff",
          padding: "48px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>
              <Link to="/" style={{ color: "rgba(255,255,255,0.7)" }}>
                首页
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/figures" style={{ color: "rgba(255,255,255,0.7)" }}>
                英烈谱
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link
                to={`/figure/${id}`}
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {storyline.figureName}
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item style={{ color: "#fff" }}>
              人物故事线
            </Breadcrumb.Item>
          </Breadcrumb>

          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={4} style={{ textAlign: "center" }}>
              {figure?.portrait ? (
                <img
                  src={figure.portrait}
                  alt={storyline.figureName}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(255,255,255,0.3)",
                  }}
                />
              ) : (
                <Avatar
                  size={100}
                  style={{ background: "#fff", color: "#722ed1", fontSize: 36 }}
                >
                  {storyline.figureName[0]}
                </Avatar>
              )}
            </Col>
            <Col xs={24} md={20}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <Tag
                  color="#fff"
                  style={{
                    color: "#722ed1",
                    fontSize: 14,
                    padding: "4px 12px",
                  }}
                >
                  <HistoryOutlined /> 人物故事线
                </Tag>
                {figure?.role && (
                  <Tag
                    color="purple"
                    style={{ fontSize: 14, padding: "4px 12px" }}
                  >
                    {figure.role}
                  </Tag>
                )}
              </div>
              <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
                {storyline.figureName} 的革命历程
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                共 {storyline.timeline.length}{" "}
                个相关历史事件，沿着时间轴回顾英雄的足迹
              </Text>
            </Col>
          </Row>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <Timeline
          mode="left"
          style={{ padding: "24px 0" }}
          items={storyline.timeline.map((item, index) => ({
            color:
              index === 0
                ? "#c41e3a"
                : index === storyline.timeline.length - 1
                  ? "#52c41a"
                  : "#722ed1",
            dot: (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background:
                    index === 0
                      ? "#c41e3a"
                      : index === storyline.timeline.length - 1
                        ? "#52c41a"
                        : "#722ed1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                {index + 1}
              </div>
            ),
            label: (
              <div>
                <Tag color="default" style={{ fontSize: 12, marginBottom: 4 }}>
                  <CalendarOutlined /> {formatDate(item.date)}
                </Tag>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block" }}
                >
                  {item.storyline_title}
                </Text>
              </div>
            ),
            children: (
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  marginBottom: 16,
                }}
                bodyStyle={{ padding: 20 }}
                onClick={() => navigate(`/chapter/${item.chapterId}`)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {item.title}
                    </Title>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ color: "#666", fontSize: 14, marginBottom: 12 }}
                    >
                      {item.content}
                    </Paragraph>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chapter/${item.chapterId}`);
                      }}
                      style={{
                        background:
                          "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
                        border: "none",
                      }}
                    >
                      阅读详情
                    </Button>
                  </div>
                </div>
              </Card>
            ),
          }))}
        />

        {storyline.timeline.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Button
              size="large"
              onClick={() =>
                navigate(`/chapter/${storyline.timeline[0].chapterId}`)
              }
              style={{
                background: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
                border: "none",
                color: "#fff",
                height: 48,
                padding: "0 40px",
                borderRadius: 24,
              }}
            >
              <PlayCircleOutlined /> 从第一个事件开始阅读
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FigureStoryline;
