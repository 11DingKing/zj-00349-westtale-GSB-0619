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
  Select,
  Pagination,
  Input,
  Space,
} from "antd";
import {
  AppstoreOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../../api/index.js";
import { formatNumber } from "../../utils/helpers.js";

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function Artifacts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artifacts, setArtifacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, selectedCategory, keyword]);

  const loadCategories = async () => {
    try {
      const data = await publicApi.getArtifactCategories();
      setCategories(data);
    } catch (err) {
      message.error(err.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { page, pageSize };
      if (selectedCategory) params.category = selectedCategory;
      const data = await publicApi.getArtifacts(params);
      setArtifacts(data.list);
      setTotal(data.total);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && artifacts.length === 0) {
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
          background: "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
          color: "#fff",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <AppstoreOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
          珍贵文物展
        </Title>
        <Paragraph
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, margin: 0 }}
        >
          透过文物，触摸那段峥嵘岁月
        </Paragraph>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <Card
          style={{ marginBottom: 24, borderRadius: 12, border: "none" }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索文物名称..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={(value) => {
                  setKeyword(value);
                  setPage(1);
                }}
                onChange={(e) => !e.target.value && setKeyword("")}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Space wrap>
                <Tag
                  color={!selectedCategory ? "#faad14" : "default"}
                  style={{
                    fontSize: 14,
                    padding: "6px 16px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedCategory(null);
                    setPage(1);
                  }}
                >
                  全部
                </Tag>
                {categories.map((cat) => (
                  <Tag
                    key={cat.name}
                    color={
                      selectedCategory === cat.name ? "#faad14" : "default"
                    }
                    style={{
                      fontSize: 14,
                      padding: "6px 16px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setPage(1);
                    }}
                  >
                    {cat.name} ({cat.count})
                  </Tag>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>

        {artifacts.length === 0 ? (
          <Empty description="暂无文物数据" />
        ) : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              {artifacts.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, overflow: "hidden" }}
                    bodyStyle={{ padding: 0 }}
                    onClick={() => navigate(`/artifact/${item.id}`)}
                  >
                    <div
                      style={{
                        width: "100%",
                        paddingTop: "100%",
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                      >
                        <EyeOutlined /> {formatNumber(item.view_count)}
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 15,
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        {item.name}
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Tag color="orange" style={{ fontSize: 11, margin: 0 }}>
                          {item.category}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.era}
                        </Text>
                      </div>
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
                showTotal={(total) => `共 ${total} 件文物`}
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

export default Artifacts;
