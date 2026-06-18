import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Statistic,
  Tag,
  Spin,
  message,
} from "antd";
import {
  PlayCircleOutlined,
  EyeOutlined,
  AppstoreOutlined,
  TeamOutlined,
  HistoryOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatNumber, getLastChapter } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [storylines, setStorylines] = useState([]);
  const [stats, setStats] = useState({
    totalChapters: 0,
    totalViews: 0,
    totalArtifacts: 0,
    totalFigures: 0,
  });
  const [lastChapter, setLastChapter] = useState(null);

  useEffect(() => {
    loadData();
    const lastCh = getLastChapter();
    if (lastCh) {
      setLastChapter(lastCh);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slData, artData, figData] = await Promise.all([
        publicApi.getStorylines(),
        publicApi.getArtifacts({ pageSize: 1 }),
        publicApi.getFigures({ pageSize: 1 }),
      ]);

      setStorylines(slData);
      setStats({
        totalChapters: slData.reduce(
          (sum, s) => sum + (s.chapter_count || 0),
          0,
        ),
        totalViews: slData.reduce((sum, s) => sum + (s.total_views || 0), 0),
        totalArtifacts: artData.total,
        totalFigures: figData.total,
      });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const continueReading = () => {
    if (lastChapter) {
      navigate(`/chapter/${lastChapter}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "#fff",
          padding: "80px 50px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(196,30,58,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            transform: "translate(30%, -30%)",
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Row gutter={[48, 24]} align="middle">
            <Col xs={24} md={14}>
              <Text
                style={{
                  color: "#c41e3a",
                  fontSize: 14,
                  letterSpacing: 4,
                  marginBottom: 16,
                  display: "block",
                }}
              >
                铭记历史 · 缅怀先烈
              </Text>
              <Title
                level={1}
                style={{
                  color: "#fff",
                  fontSize: 48,
                  fontWeight: 700,
                  marginBottom: 24,
                }}
              >
                西征悲歌
              </Title>
              <Title
                level={3}
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 400,
                  marginBottom: 24,
                }}
              >
                中国工农红军西路军征战史数字展陈
              </Title>
              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 16,
                  lineHeight: 2,
                  marginBottom: 32,
                }}
              >
                1936年10月至1937年3月，两万多名西路军将士在河西走廊与国民党反动派展开了惊心动魄的浴血奋战。
                这段悲壮的历史，彰显了中国共产党人不畏艰险、不怕牺牲的英雄气概。
                让我们穿越时空，重温那段波澜壮阔的革命岁月。
              </Paragraph>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={() =>
                    storylines.length > 0 &&
                    navigate(`/storyline/${storylines[0].id}`)
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                    border: "none",
                    height: 48,
                    padding: "0 32px",
                    fontSize: 16,
                    borderRadius: 24,
                  }}
                >
                  开始参观
                </Button>

                {lastChapter && (
                  <Button
                    size="large"
                    onClick={continueReading}
                    style={{
                      height: 48,
                      padding: "0 32px",
                      fontSize: 16,
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                    }}
                  >
                    继续上次浏览
                  </Button>
                )}
              </div>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "24px 16px" }}
                  >
                    <HistoryOutlined
                      style={{
                        fontSize: 32,
                        color: "#c41e3a",
                        marginBottom: 8,
                      }}
                    />
                    <Statistic
                      title={
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>
                          历史章节
                        </span>
                      }
                      value={stats.totalChapters}
                      valueStyle={{ color: "#fff" }}
                      formatter={formatNumber}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "24px 16px" }}
                  >
                    <EyeOutlined
                      style={{
                        fontSize: 32,
                        color: "#1890ff",
                        marginBottom: 8,
                      }}
                    />
                    <Statistic
                      title={
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>
                          总浏览量
                        </span>
                      }
                      value={stats.totalViews}
                      valueStyle={{ color: "#fff" }}
                      formatter={formatNumber}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "24px 16px" }}
                  >
                    <AppstoreOutlined
                      style={{
                        fontSize: 32,
                        color: "#faad14",
                        marginBottom: 8,
                      }}
                    />
                    <Statistic
                      title={
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>
                          珍贵文物
                        </span>
                      }
                      value={stats.totalArtifacts}
                      valueStyle={{ color: "#fff" }}
                      formatter={formatNumber}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: "24px 16px" }}
                  >
                    <TeamOutlined
                      style={{
                        fontSize: 32,
                        color: "#52c41a",
                        marginBottom: 8,
                      }}
                    />
                    <Statistic
                      title={
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>
                          英雄人物
                        </span>
                      }
                      value={stats.totalFigures}
                      valueStyle={{ color: "#fff" }}
                      formatter={formatNumber}
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title level={2} style={{ marginBottom: 16 }}>
            展陈故事线
          </Title>
          <Paragraph style={{ color: "#666", fontSize: 16 }}>
            三条主线，带您走进那段波澜壮阔的革命岁月
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {storylines.map((sl, index) => (
            <Col xs={24} md={8} key={sl.id}>
              <Card
                hoverable
                style={{ borderRadius: 16, overflow: "hidden" }}
                bodyStyle={{ padding: 0 }}
                onClick={() => navigate(`/storyline/${sl.id}`)}
              >
                <div
                  style={{
                    height: 200,
                    backgroundImage: `url(${sl.cover_image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      background:
                        "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    故事线 {index + 1}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {sl.title}
                  </Title>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{
                      color: "#666",
                      fontSize: 14,
                      marginBottom: 16,
                      minHeight: 42,
                    }}
                  >
                    {sl.description}
                  </Paragraph>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: 12 }}>
                      <Tag color="blue">{sl.chapter_count || 0} 个章节</Tag>
                      <Tag color="orange">
                        {formatNumber(sl.total_views || 0)} 次浏览
                      </Tag>
                    </div>
                    <Button
                      type="link"
                      style={{ padding: 0, color: "#c41e3a" }}
                    >
                      开始浏览 <RightOutlined />
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ background: "#fff", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Title level={2} style={{ marginBottom: 16 }}>
              快速入口
            </Title>
            <Paragraph style={{ color: "#666", fontSize: 16 }}>
              多角度了解西路军历史
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{ textAlign: "center", borderRadius: 16 }}
                bodyStyle={{ padding: "32px 24px" }}
                onClick={() => navigate("/artifacts")}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 28,
                  }}
                >
                  <AppstoreOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  珍贵文物
                </Title>
                <Paragraph style={{ color: "#999", fontSize: 13, margin: 0 }}>
                  感受历史的温度
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{ textAlign: "center", borderRadius: 16 }}
                bodyStyle={{ padding: "32px 24px" }}
                onClick={() => navigate("/figures")}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 28,
                  }}
                >
                  <TeamOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  英雄人物
                </Title>
                <Paragraph style={{ color: "#999", fontSize: 13, margin: 0 }}>
                  铭记不朽的功勋
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{ textAlign: "center", borderRadius: 16 }}
                bodyStyle={{ padding: "32px 24px" }}
                onClick={() =>
                  storylines.length > 0 &&
                  navigate(`/storyline/${storylines[1].id}`)
                }
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 28,
                  }}
                >
                  <HistoryOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  铁血英魂
                </Title>
                <Paragraph style={{ color: "#999", fontSize: 13, margin: 0 }}>
                  西路军人物志
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                style={{ textAlign: "center", borderRadius: 16 }}
                bodyStyle={{ padding: "32px 24px" }}
                onClick={() =>
                  storylines.length > 0 &&
                  navigate(`/storyline/${storylines[2].id}`)
                }
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 28,
                  }}
                >
                  <AppstoreOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  文物史料
                </Title>
                <Paragraph style={{ color: "#999", fontSize: 13, margin: 0 }}>
                  永恒的历史记忆
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

export default Home;
