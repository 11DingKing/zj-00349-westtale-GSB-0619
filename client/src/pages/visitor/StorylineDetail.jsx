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
  Image,
  Avatar,
  Tooltip,
  Badge,
} from "antd";
import {
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  CommentOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import {
  formatDate,
  formatNumber,
  isChapterWatched,
} from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;

function StorylineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storyline, setStoryline] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slData, chaptersData] = await Promise.all([
        publicApi.getStoryline(id),
        publicApi.getStorylineChapters(id),
      ]);
      setStoryline(slData);
      setChapters(chaptersData);
      if (chaptersData.length > 0) {
        setActiveChapter(chaptersData[0].id);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToChapter = (chapterId) => {
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveChapter(chapterId);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!storyline) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="故事线不存在" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "#fff",
          padding: "60px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate("/")}
            style={{ color: "#fff", marginBottom: 16, padding: 0 }}
          >
            返回首页
          </Button>

          <Row gutter={[32, 24]} align="middle">
            <Col xs={24} md={16}>
              <Tag
                color="red"
                style={{ marginBottom: 16, fontSize: 14, padding: "4px 12px" }}
              >
                {storyline.chapter_count || 0} 个章节
              </Tag>
              <Title level={1} style={{ color: "#fff", marginBottom: 16 }}>
                {storyline.title}
              </Title>
              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 16,
                  lineHeight: 2,
                }}
              >
                {storyline.description}
              </Paragraph>
              <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                  <EyeOutlined style={{ marginRight: 4 }} />{" "}
                  {formatNumber(storyline.total_views || 0)} 次浏览
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> 约{" "}
                  {Math.max(5, (storyline.chapter_count || 0) * 3)} 分钟阅读
                </Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div
                style={{
                  width: "100%",
                  paddingTop: "133%",
                  borderRadius: 16,
                  backgroundImage: `url(${storyline.cover_image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
                }}
              />
            </Col>
          </Row>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <Row gutter={[32, 24]}>
          <Col xs={24} md={6}>
            <div style={{ position: "sticky", top: 80 }}>
              <Card
                style={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
                bodyStyle={{ padding: 20 }}
                title={
                  <Text strong style={{ fontSize: 16 }}>
                    章节目录
                  </Text>
                }
              >
                {chapters.map((chapter, index) => {
                  const watched = isChapterWatched(chapter.id);
                  return (
                    <div
                      key={chapter.id}
                      onClick={() => scrollToChapter(chapter.id)}
                      style={{
                        padding: "12px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        marginBottom: 4,
                        background:
                          activeChapter === chapter.id
                            ? "rgba(196,30,58,0.08)"
                            : "transparent",
                        borderLeft:
                          activeChapter === chapter.id
                            ? "3px solid #c41e3a"
                            : "3px solid transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Badge dot={watched} color="#52c41a">
                          <Text
                            strong
                            style={{
                              color:
                                activeChapter === chapter.id
                                  ? "#c41e3a"
                                  : "#333",
                            }}
                          >
                            {index + 1}. {chapter.title}
                          </Text>
                        </Badge>
                        {watched && (
                          <Tooltip title="已看过">
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", fontSize: 14 }}
                            />
                          </Tooltip>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          marginTop: 4,
                          paddingLeft: 16,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 2 }} />{" "}
                          {formatDate(chapter.date)}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          </Col>

          <Col xs={24} md={18}>
            <div style={{ marginBottom: 32 }}>
              <Title level={3} style={{ marginBottom: 24 }}>
                <ClockCircleOutlined
                  style={{ color: "#c41e3a", marginRight: 8 }}
                />
                历史时间轴
              </Title>
              <Timeline
                mode="left"
                style={{
                  padding: 24,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
                items={chapters.map((chapter, index) => {
                  const watched = isChapterWatched(chapter.id);
                  return {
                    color: watched
                      ? "#52c41a"
                      : index === 0
                        ? "#c41e3a"
                        : "#d9d9d9",
                    dot: watched ? <CheckCircleOutlined /> : undefined,
                    label: (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDate(chapter.date)}
                        </Text>
                      </div>
                    ),
                    children: (
                      <Card
                        size="small"
                        hoverable
                        onClick={() => navigate(`/chapter/${chapter.id}`)}
                        style={{
                          cursor: "pointer",
                          border: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 16,
                            alignItems: "center",
                          }}
                        >
                          {chapter.images && chapter.images.length > 0 && (
                            <Image
                              src={chapter.images[0]}
                              alt={chapter.title}
                              width={100}
                              height={70}
                              style={{ borderRadius: 6, objectFit: "cover" }}
                              preview={false}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              <Text strong style={{ fontSize: 15 }}>
                                {chapter.title}
                              </Text>
                              {watched && (
                                <Tag color="success" style={{ fontSize: 11 }}>
                                  已看过
                                </Tag>
                              )}
                            </div>
                            <Paragraph
                              ellipsis={{ rows: 1 }}
                              style={{
                                color: "#666",
                                fontSize: 13,
                                margin: "0 0 8px 0",
                              }}
                            >
                              {chapter.content}
                            </Paragraph>
                            <div style={{ display: "flex", gap: 16 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <EyeOutlined />{" "}
                                {formatNumber(chapter.view_count)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <HeartOutlined />{" "}
                                {formatNumber(chapter.flower_count)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <CommentOutlined />{" "}
                                {formatNumber(chapter.comment_count)}
                              </Text>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                          >
                            阅读
                          </Button>
                        </div>
                      </Card>
                    ),
                  };
                })}
              />
            </div>

            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                style={{ marginBottom: 32, scrollMarginTop: 80 }}
              >
                <Card
                  style={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                  bodyStyle={{ padding: 24 }}
                  hoverable
                  onClick={() => navigate(`/chapter/${chapter.id}`)}
                >
                  <Row gutter={[24, 16]}>
                    <Col xs={24} md={8}>
                      {chapter.images && chapter.images.length > 0 && (
                        <Image
                          src={chapter.images[0]}
                          alt={chapter.title}
                          style={{
                            width: "100%",
                            borderRadius: 8,
                            aspectRatio: "4/3",
                            objectFit: "cover",
                          }}
                          preview={false}
                        />
                      )}
                    </Col>
                    <Col xs={24} md={16}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <Tag color="blue">{formatDate(chapter.date)}</Tag>
                        <Tag color="default">第 {index + 1} 章</Tag>
                        {isChapterWatched(chapter.id) && (
                          <Tag color="success">已看过</Tag>
                        )}
                      </div>
                      <Title level={4} style={{ marginBottom: 12 }}>
                        {chapter.title}
                      </Title>
                      <Paragraph
                        ellipsis={{ rows: 3 }}
                        style={{
                          color: "#666",
                          lineHeight: 1.8,
                          marginBottom: 16,
                        }}
                      >
                        {chapter.content}
                      </Paragraph>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", gap: 20 }}>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            <EyeOutlined style={{ marginRight: 4 }} />{" "}
                            {formatNumber(chapter.view_count)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            <HeartOutlined style={{ marginRight: 4 }} />{" "}
                            {formatNumber(chapter.flower_count)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            <CommentOutlined style={{ marginRight: 4 }} />{" "}
                            {formatNumber(chapter.comment_count)}
                          </Text>
                        </div>
                        <Button
                          type="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chapter/${chapter.id}`);
                          }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </div>
            ))}
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default StorylineDetail;
