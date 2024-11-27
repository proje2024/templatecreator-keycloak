import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Table, ConfigProvider, Button, Modal, message, Input } from 'antd';
import { EditFilled, DeleteFilled, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import colorPalette from '../../colorPalette';
import './TemplateDetail.css';


const TemplateDetail = () => {
    const location = useLocation();
    const { templateId, templateName } = location.state || {};
    const [templateFields, setTemplateFields] = useState([]);
    const [records, setRecords] = useState([]);
    const [columns, setColumns] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    const [searchText, setSearchText] = useState('');
    const [filteredRecords, setFilteredRecords] = useState([]);

    useEffect(() => {
        fetchTemplateFields(templateId);
        fetchTemplateRecords(templateId);
    }, [templateId]);

    // Template field verilerini getiren fonksiyon
    const fetchTemplateFields = async (templateId) => {
        try {
            const response = await axios.get(`/api/template-fields/template/${templateId}`);
            const fields = response.data;
            setTemplateFields(fields);
            // Dinamik kolonları oluştur ve güncelle
            const dynamicColumns = fields.map(field => ({
                title: field.fieldName,
                dataIndex: field.id,
                key: field.id,
                editable: true,
                align: 'center',
                sorter: (a, b) => {
                    // Kolon tipi numara ise, sayısal sıralama yap
                    if (typeof a[field.id] === 'number' && typeof b[field.id] === 'number') {
                        return a[field.id] - b[field.id];
                    }
                    // Diğer durumda alfabetik sıralama yap
                    return a[field.id]?.localeCompare(b[field.id]);
                },
            }));

            dynamicColumns.push({
                title: 'Aksiyonlar',
                key: 'aksiyonlar',
                align: 'center',
                render: (_, record) => (
                    <span className='template-detail-actions-buttons'>

                        <Button
                            className='template-detail-edit-button'
                            onClick={() => handleEditRecord(record)}
                            icon={<EditFilled />} />

                        <Button
                            className='template-detail-delete-button'
                            icon={<DeleteFilled />}
                            danger
                            onClick={() => showDeleteModal(record)}
                        />

                    </span>
                ),
            });

            setColumns(dynamicColumns);
        } catch (error) {
            console.error('Error fetching template fields:', error);
        }
    };

    // Template kayıt verilerini getiren fonksiyon
    const fetchTemplateRecords = async (templateId) => {
        try {
            const response = await axios.get(`/api/template-records/template/${templateId}`);
            const recordsData = response.data.map(record => ({
                ...record.recordData, // Her kaydın JSON verisini satır olarak ekle
                id: record.id, // Her satır için benzersiz kimlik ekle
            }));
            setRecords(recordsData);
        } catch (error) {
            console.error('Error fetching template records:', error);
        }
    };

    // Formu doğrulayan fonksiyon
    const validateForm = () => {
        const emptyFields = templateFields.filter(
            (field) => field.isRequired && !selectedRecord[field.id]
        );

        if (emptyFields.length > 0) {
            message.error('Zorunlu alanları doldurduğunuzdan emin olun!');
            return false;
        }
        return true;
    };


    // Kayıt silme fonksiyonu
    const deleteRecord = async () => {
        if (!recordToDelete) return;
        try {
            await axios.delete(`/api/template-records/${recordToDelete.id}`);
            message.success('Kayıt başarıyla silindi!');
            setRecords((prevRecords) =>
                prevRecords.filter((record) => record.id !== recordToDelete.id)
            );
            setFilteredRecords((prevRecords) =>
                prevRecords.filter((record) => record.id !== recordToDelete.id)
            );
            setIsDeleteModalVisible(false);
            setRecordToDelete(null);
        } catch (error) {
            console.error('Error deleting record:', error);
            message.error('Kayıt silinirken bir hata oluştu.');
        }
    };

    // Silme onay modali
    const showDeleteModal = (record) => {
        setRecordToDelete(record);
        setIsDeleteModalVisible(true);
    };

    const handleAddNewRecord = () => {
        setIsEditing(false);
        setSelectedRecord(null);
        setIsModalVisible(true); 
    };

    const handleEditRecord = (record) => {
        setIsEditing(true);
        setSelectedRecord(record); 
        setIsModalVisible(true); 
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
    };

    const handleSaveRecord = async () => {
        if (!selectedRecord) return;
        if (!validateForm()) return;

        try {
            const url = isEditing
                ? `/api/template-records/${selectedRecord.id}`
                : `/api/template-records`; 

            const method = isEditing ? 'put' : 'post';

            const response = await axios({
                method,
                url,
                data: {
                    templateId,
                    recordData: selectedRecord,
                },
            });

            if (response.status === 200 || response.status === 201) {
                message.success(
                    isEditing ? 'Kayıt başarıyla güncellendi!' : 'Yeni kayıt başarıyla oluşturuldu!'
                );
                fetchTemplateRecords(templateId);
                setIsModalVisible(false);
                setSelectedRecord(null);
            }
        } catch (error) {
            console.error('Error saving record:', error);
            message.error('Kayıt kaydedilirken bir hata oluştu.');
        }
    };

    const handleSearchRecords = (e) => {
        const value = e.target.value.toLowerCase().trim();
        setSearchText(value);

        if (!value) {
            setFilteredRecords(records);
            return;
        }

        const filtered = records.filter((record) =>
            Object.values(record).some(
                (fieldValue) =>
                    fieldValue &&
                    fieldValue.toString().toLowerCase().includes(value)
            )
        );

        setFilteredRecords(filtered);
    };




    return (
        <div className='template-details-container'>
            <h1 className='template-details-title'>{templateName || 'Template Name not found'}</h1>

            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            colorText: colorPalette.white,
                            colorBgContainer: colorPalette.darkBlue,
                            rowHoverBg: colorPalette.hoverBlue,
                            borderColor: colorPalette.darkBlue2,

                            // Header
                            headerBg: colorPalette.darkBlue2,
                            headerColor: colorPalette.white,
                        },
                        Pagination: {
                            colorText: colorPalette.white,
                            colorBgContainer: colorPalette.darkBlue,
                            colorPrimary: colorPalette.darkBlue,
                            colorPrimaryHover: colorPalette.hoverBlue,
                            colorBorder: colorPalette.darkBlue2,
                            itemActiveBg: colorPalette.lightBlue,
                        },
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
                    },
                }}
            >

                <div className="search-bar-new-records-container">
                    <Input
                        className="search-bar-template-detail"
                        placeholder="Kayıtlar arasında ara..."
                        value={searchText}
                        onChange={handleSearchRecords}
                        prefix={<SearchOutlined className='search-icon' />}
                    />

                    <Button
                        className='template-detail-add-new-row-button'
                        type="primary"
                        onClick={handleAddNewRecord}
                    >
                        Yeni Kayıt +
                    </Button>

                </div>

                <Table columns={columns} dataSource={filteredRecords.length > 0 ? filteredRecords : records} rowKey="id" />

                <Modal
                    title="Kayıt Silme Onayı"
                    visible={isDeleteModalVisible}
                    onCancel={() => setIsDeleteModalVisible(false)}
                    onOk={deleteRecord}
                    okText="Evet"
                    okType="danger"
                    cancelText="Hayır"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ExclamationCircleOutlined style={{ fontSize: '24px', color: colorPalette.hoverOrange }} />
                        <p>Bu kaydı silmek istediğinizden emin misiniz?</p>
                    </div>
                </Modal>

                <Modal
                    title={isEditing ? "Kayıt Düzenle" : "Yeni Kayıt Ekle"}
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    footer={[
                        <Button key="cancel" onClick={handleModalClose}>İptal</Button>,
                        <Button key="submit" onClick={handleSaveRecord} type="primary">Kaydet</Button>,
                    ]}
                >
                    {templateFields.map((field) => (
                        <div key={field.id} className="field-container">
                            <p><strong>{field.fieldName} ({field.fieldType}):</strong></p>
                            <Input
                                placeholder={field.isRequired ? 'Bu alan zorunludur' : ''}
                                type={(field.fieldType === 'STRING' || field.fieldType === 'BOOLEAN') ? "text" : "number"}
                                value={
                                    (field.fieldType === 'FLOAT' && selectedRecord?.[field.id] !== undefined)
                                        ? parseFloat(selectedRecord[field.id]).toFixed(3)
                                        : selectedRecord?.[field.id] || ''
                                }
                                step={field.fieldType === 'FLOAT' ? 0.001 : undefined}
                                status={
                                    field.isRequired && !selectedRecord?.[field.id]
                                        ? 'error'
                                        : ''
                                }
                                onChange={(e) =>
                                    setSelectedRecord((prev) => ({
                                        ...prev,
                                        [field.id]: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    ))}
                </Modal>
            </ConfigProvider>
        </div>
    );
};

export default TemplateDetail;
