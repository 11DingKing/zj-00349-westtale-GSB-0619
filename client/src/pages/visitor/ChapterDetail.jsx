import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Tag,
  Image,
  Empty,
  Spin,
  message,
  Avatar,
  Input,
  List,
  Modal,
  Form,
  Divider,
  Space,
  Tooltip,
  Badge,
  Carousel,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  HeartOutlined,
  CommentOutlined,
  LikeOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  SendOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  getVisitorId,
  isChapterWatched,
  markChapterWatched,
  setLastChapter,
} from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

function ChapterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(null);
  const [comments, setComments] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [commentForm] = Form.useForm();
  const [flowerForm] = Form.useForm();
  const [showFlowerModal, setShowFlowerModal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingFlower, setSubmittingFlower] = useState(false);
  const [watched, setWatched] = useState(false);
  const [localFlowerCount, setLocalFlowerCount] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (chapter) {
      setLastChapter(chapter.id);
      setLocalFlowerCount(chapter.flower_count || 0);
    }
  }, [chapter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const chapterData = await publicApi.getChapter(id);
      setChapter(chapterData);
      setWatched(isChapterWatched(chapterData.id));

      const [commentsData, flowersData] = await Promise.all([
        publicApi.getComments(id, { pageSize: 50 }),
        publicApi.getFlowers(id, { pageSize: 20 }),
      ]);
      setComments(commentsData.list);
      setFlowers(flowersData.list);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkWatched = async () => {
    try {
      const visitorId = getVisitorId();
      await publicApi.markWatched(id, visitorId);
      markChapterWatched(id);
      setWatched(true);
      message.success("已标记为看过");
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmitComment = async (values) => {
    try {
      setSubmittingComment(true);
      const visitorId = getVisitorId();
      await publicApi.addComment(id, {
        visitorName: values.visitorName,
        content: values.content,
      });
      message.success("留言提交成功，等待审核");
      commentForm.resetFields();
      loadData();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSendFlower = async (values) => {
    try {
      setSubmittingFlower(true);
      const visitorId = getVisitorId();
      const result = await publicApi.sendFlower(id, {
        visitorName: values.visitorName || "匿名用户",
        message: values.message || "",
      });
      setLocalFlowerCount(result.flowerCount);
      setShowFlowerModal(false);
      flowerForm.resetFields();
      message.success("献花成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmittingFlower(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const result = await publicApi.likeComment(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, like_count: result.like_count } : c,
        ),
      );
    } catch (err) {
      message.error(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="章节不存在" />
      </div>
    );
  }

  return (
    <div ref={contentRef}>
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "#fff",
          padding: "32px 24px",
          position: "sticky",
          top: 64,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Space>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => navigate(`/storyline/${chapter.storyline_id}`)}
                style={{ color: "#fff" }}
              >
                返回故事线
              </Button>
              <Tag color="blue" style={{ fontSize: 12 }}>
                {chapter.storyline_title}
              </Tag>
            </Space>
            <Space>
              {chapter.prevChapter && (
                <Tooltip title={chapter.prevChapter.title}>
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() =>
                      navigate(`/chapter/${chapter.prevChapter.id}`)
                    }
                    style={{ color: "#fff" }}
                  >
                    上一章
                  </Button>
                </Tooltip>
              )}
              {chapter.nextChapter && (
                <Tooltip title={chapter.nextChapter.title}>
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(`/chapter/${chapter.nextChapter.id}`)
                    }
                    style={{
                      background:
                        "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                      border: "none",
                    }}
                  >
                    下一章 <ArrowRightOutlined />
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Tag color="red">{formatDate(chapter.date)}</Tag>
            {watched && (
              <Tag color="success">
                <CheckCircleOutlined /> 已看过
              </Tag>
            )}
          </div>
          <Title level={2} style={{ color: "#fff", marginBottom: 16 }}>
            {chapter.title}
          </Title>
          <div style={{ display: "flex", gap: 24 }}>
            <Space>
              <EyeOutlined style={{ color: "rgba(255,255,255,0.6)" }} />
              <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                {formatNumber(chapter.view_count)} 次浏览
              </Text>
            </Space>
            <Space>
              <HeartOutlined style={{ color: "rgba(255,255,255,0.6)" }} />
              <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                {formatNumber(localFlowerCount)} 朵献花
              </Text>
            </Space>
            <Space>
              <CommentOutlined style={{ color: "rgba(255,255,255,0.6)" }} />
              <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                {formatNumber(chapter.comment_count)} 条留言
              </Text>
            </Space>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <Row gutter={[32, 24]}>
          <Col xs={24} lg={16}>
            {chapter.images && chapter.images.length > 0 && (
              <Card
                style={{ marginBottom: 24, borderRadius: 12, border: "none" }}
                bodyStyle={{ padding: 0 }}
              >
                <Carousel
                  autoplay
                  effect="fade"
                  style={{ borderRadius: 12, overflow: "hidden" }}
                >
                  {chapter.images.map((img, idx) => (
                    <div key={idx}>
                      <div
                        style={{
                          width: "100%",
                          paddingTop: "56.25%",
                          backgroundImage: `url(${img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            bottom: 16,
                            right: 16,
                            background: "rgba(0,0,0,0.5)",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        >
                          {idx + 1} / {chapter.images.length}
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </Card>
            )}

            <Card
              style={{ borderRadius: 12, border: "none", marginBottom: 24 }}
              bodyStyle={{ padding: 32 }}
            >
              <Paragraph
                style={{
                  fontSize: 16,
                  lineHeight: 2.2,
                  textIndent: "2em",
                  color: "#333",
                }}
              >
                {chapter.content}
              </Paragraph>
            </Card>

            <Space
              style={{
                marginBottom: 24,
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {!watched && (
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleMarkWatched}
                  style={{
                    background:
                      "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                    border: "none",
                    height: 48,
                    padding: "0 32px",
                    borderRadius: 24,
                  }}
                >
                  标记看过
                </Button>
              )}
              <Button
                size="large"
                icon={<HeartOutlined />}
                onClick={() => setShowFlowerModal(true)}
                style={{
                  height: 48,
                  padding: "0 32px",
                  borderRadius: 24,
                  borderColor: "#c41e3a",
                  color: "#c41e3a",
                }}
              >
                献花致敬 ({formatNumber(localFlowerCount)})
              </Button>
            </Space>

            <Card
              style={{ borderRadius: 12, border: "none", marginBottom: 24 }}
              title={
                <Space>
                  <HeartOutlined style={{ color: "#c41e3a" }} />
                  <Text strong>致敬献花</Text>
                </Space>
              }
              extra={
                <Text type="secondary">
                  共 {formatNumber(localFlowerCount)} 朵
                </Text>
              }
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {Array(Math.min(12, flowers.length))
                  .fill(0)
                  .map((_, i) => (
                    <Tooltip
                      key={i}
                      title={`${flowers[i]?.visitor_name || "匿名"}: ${flowers[i]?.message || ""}`}
                    >
                      <div style={{ textAlign: "center", width: 50 }}>
                        <div
                          style={{
                            fontSize: 24,
                            marginBottom: 4,
                            animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        >
                          🌹
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                {flowers.length > 12 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 50,
                      height: 50,
                      background: "#f5f5f5",
                      borderRadius: "50%",
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    +{flowers.length - 12}
                  </div>
                )}
              </div>
              <List
                size="small"
                dataSource={flowers.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<HeartOutlined />}
                          style={{ background: "#ffe4e6", color: "#c41e3a" }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.visitor_name || "匿名用户"}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            🌹
                          </Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          {item.message && (
                            <Text style={{ fontSize: 13 }}>{item.message}</Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatDateTime(item.created_at)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card
              style={{ borderRadius: 12, border: "none" }}
              title={
                <Space>
                  <CommentOutlined style={{ color: "#1890ff" }} />
                  <Text strong>互动留言</Text>
                </Space>
              }
              extra={
                <Text type="secondary">共 {comments.length} 条已审核</Text>
              }
            >
              <Card
                size="small"
                style={{
                  marginBottom: 24,
                  background: "#fafafa",
                  border: "none",
                }}
              >
                <Form
                  form={commentForm}
                  layout="vertical"
                  onFinish={handleSubmitComment}
                >
                  <Form.Item
                    name="visitorName"
                    label="您的称呼"
                    rules={[{ required: true, message: "请输入您的称呼" }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input placeholder="请输入您的称呼" maxLength={20} />
                  </Form.Item>
                  <Form.Item
                    name="content"
                    label="留言内容"
                    rules={[{ required: true, message: "请输入留言内容" }]}
                    style={{ marginBottom: 12 }}
                  >
                    <TextArea
                      rows={3}
                      placeholder="写下您的感想和寄语，文明留言..."
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                  <Form.Item style={{ margin: 0, textAlign: "right" }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      loading={submittingComment}
                    >
                      提交留言
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {comments.length === 0 ? (
                <Empty description="暂无留言，来发表第一条感想吧" />
              ) : (
                <List
                  dataSource={comments}
                  pagination={{ pageSize: 10, size: "small" }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          icon={<LikeOutlined />}
                          onClick={() => handleLikeComment(item.id)}
                        >
                          {item.like_count || 0}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: "#1890ff" }}>
                            {item.visitor_name?.[0] || "游"}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{item.visitor_name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDateTime(item.created_at)}
                            </Text>
                          </Space>
                        }
                        description={
                          <Text style={{ fontSize: 14, color: "#333" }}>
                            {item.content}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ position: "sticky", top: 200 }}>
              {!watched && (
                <Card
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    border: "none",
                    background:
                      "linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)",
                  }}
                >
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<CheckCircleOutlined />}
                      onClick={handleMarkWatched}
                      style={{
                        background:
                          "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                        border: "none",
                        height: 44,
                      }}
                    >
                      标记为看过
                    </Button>
                  </div>
                </Card>
              )}

              {chapter.figures && chapter.figures.length > 0 && (
                <Card
                  style={{ marginBottom: 16, borderRadius: 12, border: "none" }}
                  title={
                    <Space>
                      <TeamOutlined style={{ color: "#52c41a" }} />
                      <Text strong>关联人物</Text>
                    </Space>
                  }
                >
                  <List
                    size="small"
                    dataSource={chapter.figures}
                    renderItem={(item) => (
                      <List.Item
                        style={{ cursor: "pointer", padding: "8px 0" }}
                        onClick={() => navigate(`/figure/${item.id}`)}
                      >
                        <List.Item.Meta
                          avatar={
                            item.portrait ? (
                              <Image
                                src={item.portrait}
                                width={40}
                                height={40}
                                style={{
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                                preview={false}
                              />
                            ) : (
                              <Avatar style={{ background: "#52c41a" }}>
                                {item.name[0]}
                              </Avatar>
                            )
                          }
                          title={
                            <Space>
                              <Text strong>{item.name}</Text>
                              <Tag color="green" style={{ fontSize: 11 }}>
                                {item.role}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Text
                              type="secondary"
                              ellipsis
                              style={{ fontSize: 12 }}
                            >
                              {item.birth_date && item.death_date
                                ? `${formatDate(item.birth_date)} - ${formatDate(item.death_date)}`
                                : ""}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {chapter.artifacts && chapter.artifacts.length > 0 && (
                <Card
                  style={{ marginBottom: 16, borderRadius: 12, border: "none" }}
                  title={
                    <Space>
                      <AppstoreOutlined style={{ color: "#faad14" }} />
                      <Text strong>关联文物</Text>
                    </Space>
                  }
                >
                  <Row gutter={[8, 8]}>
                    {chapter.artifacts.map((item) => (
                      <Col span={12} key={item.id}>
                        <Card
                          size="small"
                          hoverable
                          style={{ cursor: "pointer" }}
                          bodyStyle={{ padding: 8 }}
                          onClick={() => navigate(`/artifact/${item.id}`)}
                        >
                          <div
                            style={{
                              width: "100%",
                              paddingTop: "100%",
                              borderRadius: 6,
                              backgroundImage: `url(${item.image})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              marginBottom: 6,
                            }}
                          />
                          <Text
                            strong
                            ellipsis
                            style={{ fontSize: 12, display: "block" }}
                          >
                            {item.name}
                          </Text>
                          <Tag
                            color="orange"
                            style={{
                              fontSize: 10,
                              padding: "0 4px",
                              margin: 0,
                            }}
                          >
                            {item.category}
                          </Tag>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              <Card
                style={{ borderRadius: 12, border: "none" }}
                title={
                  <Space>
                    <HistoryOutlined style={{ color: "#c41e3a" }} />
                    <Text strong>章节导航</Text>
                  </Space>
                }
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {chapter.prevChapter && (
                    <Button
                      block
                      icon={<ArrowLeftOutlined />}
                      onClick={() =>
                        navigate(`/chapter/${chapter.prevChapter.id}`)
                      }
                    >
                      上一章：{chapter.prevChapter.title}
                    </Button>
                  )}
                  {chapter.nextChapter && (
                    <Button
                      type="primary"
                      block
                      onClick={() =>
                        navigate(`/chapter/${chapter.nextChapter.id}`)
                      }
                      style={{
                        background:
                          "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                        border: "none",
                      }}
                    >
                      下一章：{chapter.nextChapter.title} <ArrowRightOutlined />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <Modal
        title={
          <Space>
            <span style={{ fontSize: 24 }}>🌹</span>
            <Text strong>献花致敬</Text>
          </Space>
        }
        open={showFlowerModal}
        onCancel={() => setShowFlowerModal(false)}
        footer={null}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🌹</div>
          <Text type="secondary">向革命先烈敬献一束鲜花，表达崇高敬意</Text>
        </div>
        <Form form={flowerForm} layout="vertical" onFinish={handleSendFlower}>
          <Form.Item name="visitorName" label="您的称呼">
            <Input placeholder="匿名用户（可选）" maxLength={20} />
          </Form.Item>
          <Form.Item name="message" label="寄语（可选）">
            <TextArea
              rows={3}
              placeholder="写下您想对先烈说的话..."
              maxLength={100}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={submittingFlower}
              style={{
                background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                border: "none",
                height: 48,
              }}
            >
              确认献花 🌹
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export default ChapterDetail;
