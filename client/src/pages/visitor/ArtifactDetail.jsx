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
  Divider,
  List,
  Space,
} from "antd";
import {
  AppstoreOutlined,
  LeftOutlined,
  EyeOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, Link } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatDate, formatNumber } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;

function ArtifactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getArtifact(id);
      setArtifact(data);
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

  if (!artifact) {
    return (
      <div style={{ padding: 50 }}>
        <Empty description="文物不存在" />
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
          <Link to="/artifacts">珍贵文物</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{artifact.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[32, 24]}>
        <Col xs={24} md={10}>
          <Card
            style={{ borderRadius: 12, border: "none", overflow: "hidden" }}
            bodyStyle={{ padding: 0 }}
          >
            <Image
              src={artifact.image}
              alt={artifact.name}
              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            style={{ borderRadius: 12, border: "none" }}
            bodyStyle={{ padding: 32 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag
                  color="orange"
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  {artifact.category}
                </Tag>
                <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                  {artifact.era}
                </Tag>
                <Tag
                  color="default"
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  <EyeOutlined /> {formatNumber(artifact.view_count)} 次浏览
                </Tag>
              </Space>
            </div>

            <Title level={2} style={{ marginBottom: 16 }}>
              {artifact.name}
            </Title>

            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 2,
                color: "#333",
                textIndent: "2em",
              }}
            >
              {artifact.description}
            </Paragraph>
          </Card>

          {artifact.relatedChapters && artifact.relatedChapters.length > 0 && (
            <Card
              style={{ marginTop: 24, borderRadius: 12, border: "none" }}
              title={
                <Space>
                  <HistoryOutlined style={{ color: "#c41e3a" }} />
                  <Text strong>相关历史章节</Text>
                </Space>
              }
            >
              <List
                dataSource={artifact.relatedChapters}
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
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {formatDate(item.date)}
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

export default ArtifactDetail;
