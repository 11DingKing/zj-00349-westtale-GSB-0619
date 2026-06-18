import React, { useState, useEffect } from "react";
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
  Breadcrumb,
  Descriptions,
  List,
  Divider,
  Space,
} from "antd";
import {
  TeamOutlined,
  LeftOutlined,
  EyeOutlined,
  HistoryOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatDate, formatNumber } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;

function FigureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [figure, setFigure] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getFigure(id);
      setFigure(data);
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

  if (!figure) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="人物不存在" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/figures">英烈谱</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{figure.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[32, 24]}>
        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 12,
              border: "none",
              overflow: "hidden",
              textAlign: "center",
            }}
            bodyStyle={{ padding: 32 }}
          >
            <div style={{ marginBottom: 20 }}>
              {figure.portrait ? (
                <Image
                  src={figure.portrait}
                  alt={figure.name}
                  width={160}
                  height={160}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "4px solid #e6f7ff",
                  }}
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    color: "#fff",
                    fontSize: 64,
                  }}
                >
                  {figure.name[0]}
                </div>
              )}
            </div>

            <Tag
              color="green"
              style={{ fontSize: 14, padding: "4px 16px", marginBottom: 12 }}
            >
              {figure.role}
            </Tag>

            <Title level={2} style={{ marginBottom: 16 }}>
              {figure.name}
            </Title>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 24,
                marginBottom: 24,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  浏览次数
                </Text>
                <Text strong style={{ fontSize: 18 }}>
                  {formatNumber(figure.view_count)}
                </Text>
              </div>
            </div>

            <Button
              type="primary"
              block
              icon={<HistoryOutlined />}
              onClick={() => navigate(`/figure/${id}/storyline`)}
              style={{
                background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                border: "none",
              }}
            >
              查看人物故事线
            </Button>
          </Card>

          <Card
            style={{ marginTop: 24, borderRadius: 12, border: "none" }}
            bodyStyle={{ padding: 24 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={
                  <span>
                    <UserOutlined style={{ marginRight: 4 }} /> 姓名
                  </span>
                }
              >
                {figure.name}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <CalendarOutlined style={{ marginRight: 4 }} /> 生卒年月
                  </span>
                }
              >
                {figure.birth_date && figure.death_date
                  ? `${formatDate(figure.birth_date)} - ${formatDate(figure.death_date)}`
                  : "不详"}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <TeamOutlined style={{ marginRight: 4 }} /> 职务
                  </span>
                }
              >
                {figure.role || "不详"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            style={{ borderRadius: 12, border: "none" }}
            bodyStyle={{ padding: 32 }}
          >
            <Title level={4} style={{ marginBottom: 16 }}>
              <TeamOutlined style={{ color: "#52c41a", marginRight: 8 }} />
              人物生平
            </Title>
            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 2.2,
                color: "#333",
                textIndent: "2em",
              }}
            >
              {figure.description}
            </Paragraph>
          </Card>

          {figure.relatedChapters && figure.relatedChapters.length > 0 && (
            <Card
              style={{ marginTop: 24, borderRadius: 12, border: "none" }}
              title={
                <Space>
                  <HistoryOutlined style={{ color: "#c41e3a" }} />
                  <Text strong>相关历史章节</Text>
                  <Text type="secondary">
                    （共 {figure.relatedChapters.length} 个章节）
                  </Text>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate(`/figure/${id}/storyline`)}
                >
                  查看完整故事线
                </Button>
              }
            >
              <List
                dataSource={figure.relatedChapters}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: "pointer", padding: "12px 0" }}
                    onClick={() => navigate(`/chapter/${item.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            {item.storyline_title}
                          </Tag>
                          <Tag color="default" style={{ fontSize: 11 }}>
                            {formatDate(item.date)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontSize: 13 }}
                        >
                          {item.content}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default FigureDetail;
