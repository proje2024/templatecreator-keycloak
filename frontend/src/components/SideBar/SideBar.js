import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Menu, ConfigProvider } from "antd";
import { UserOutlined, AppstoreAddOutlined, HomeFilled, LogoutOutlined } from "@ant-design/icons";
import TemplateEditModal from "../TemplateList/TemplateEditModal.js"; 
import "./SideBar.css";
import colorPalette from "../../colorPalette.js";
import { useAuth } from '../../AuthContext';

const { Sider } = Layout;

const SideBar = ({fetchTemplates}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const onCollapse = (collapsed) => {
        setCollapsed(collapsed);
    };

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleSave = (templateData) => {
        console.log("Yeni model kaydedildi:", templateData);
        
        closeModal();
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Button: {
                        colorText: colorPalette.white,
                        colorBgContainer: colorPalette.darkBlue2,
                        lineWidth: 1,
                        defaultBorderColor: colorPalette.darkBlue2,
                    },
                    Input: {
                        colorBgContainer: colorPalette.darkBlue,
                        lineWidth: 1,
                        colorText: colorPalette.white,
                        colorTextPlaceholder: colorPalette.lightBlue,
                        colorBorder: colorPalette.darkBlue2,
                        colorPlaceholder: colorPalette.darkBlue2,
                    },
                    Modal: {
                        contentBg: colorPalette.darkBlue2,
                        titleColor: colorPalette.white,
                        headerBg: colorPalette.darkBlue2,
                    },
                    Select: {
                        colorBgContainer: colorPalette.darkBlue,
                        colorText: colorPalette.white,
                        colorBorder: colorPalette.darkBlue2,
                        colorError: colorPalette.red,
                        colorHelp: colorPalette.darkBlue,
                        optionSelectedBg: colorPalette.hoverBlue,
                        optionActiveBg: colorPalette.lightBlue,
                        optionSelectedColor: colorPalette.white,
                        multipleItemBg: colorPalette.hoverBlue,
                    },
                },
            }}
        >
            <Sider className="side-bar" collapsible collapsed={collapsed} onCollapse={onCollapse}>
                <div className="app-name">
                    <strong className="side-bar-app-name">Template Creator</strong>
                </div>
                <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline">
                    <Menu.Item key="1" icon={<HomeFilled />} onClick={() => navigate("/home")}>
                        Ana Sayfa
                    </Menu.Item>
                    {/* <Menu.Item key="2" icon={<UserOutlined />}>
                        Kullanıcılar
                    </Menu.Item> */}
                    <Menu.Item key="3" icon={<AppstoreAddOutlined />} onClick={openModal}>
                        Yeni Model Ekle
                    </Menu.Item>
                    <Menu.Item key="4" icon={<LogoutOutlined />} onClick={logout}>
                        Çıkış Yap
                    </Menu.Item>
                </Menu>

                <TemplateEditModal
                    visible={modalVisible}
                    onClose={closeModal}
                    onSave={handleSave}
                    fetchTemplates={fetchTemplates}
                />
            </Sider>
        </ConfigProvider>
    );
};

export default SideBar;
