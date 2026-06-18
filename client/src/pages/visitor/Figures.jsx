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
  Pagination,
  Input,
  Avatar,
} from "antd";
import {
  TeamOutlined,
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatDate, formatNumber } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

function Figures() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [figures, setFigures] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getFigures({ page, pageSize });
      setFigures(data.list);
      setTotal(data.total);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && figures.length === 0) {
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
          background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
          color: "#fff",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
          英烈谱
        </Title>
        <Paragraph
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, margin: 0 }}
        >
          铭记英雄，缅怀先烈
        </Paragraph>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <Card
          style={{ marginBottom: 24, borderRadius: 12, border: "none" }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Search
                placeholder="搜索人物姓名..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
              />
            </Col>
          </Row>
        </Card>

        {figures.length === 0 ? (
          <Empty description="暂无人物数据" />
        ) : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              {figures.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                    bodyStyle={{ padding: 24 }}
                    onClick={() => navigate(`/figure/${item.id}`)}
                  >
                    <div style={{ position: "relative", marginBottom: 16 }}>
                      {item.portrait ? (
                        <Image
                          src={item.portrait}
                          alt={item.name}
                          width={100}
                          height={100}
                          style={{
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #e6f7ff",
                          }}
                          preview={false}
                        />
                      ) : (
                        <Avatar
                          size={100}
                          style={{ background: "#52c41a", fontSize: 36 }}
                        >
                          {item.name[0]}
                        </Avatar>
                      )}
                      <Tag
                        color="green"
                        style={{
                          position: "absolute",
                          bottom: -4,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: 10,
                        }}
                      >
                        {item.role}
                      </Tag>
                    </div>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.birth_date && item.death_date && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 12,
                        }}
                      >
                        {formatDate(item.birth_date)} -{" "}
                        {formatDate(item.death_date)}
                      </Text>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-around",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <EyeOutlined /> {formatNumber(item.view_count)}
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, fontSize: 12 }}
                        icon={<HistoryOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/figure/${item.id}/storyline`);
                        }}
                      >
                        相关故事
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 位人物`}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Figures;
