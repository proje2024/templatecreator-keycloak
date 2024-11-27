import React from 'react';
import { Input, Select, Checkbox, Tooltip, Button, message } from 'antd';
import { DeleteFilled } from '@ant-design/icons';
import axios from 'axios';

const FieldEditor = ({ field, onFieldChange, onDeleteField }) => {
    const handleFieldNameChange = (value) => {
        onFieldChange({ ...field, fieldName: value });
    };

    const handleFieldTypeChange = (value) => {
        onFieldChange({ ...field, fieldType: value });
    };

    const handleIsRequiredChange = (checked) => {
        onFieldChange({ ...field, isRequired: checked });
    };

    const deleteField = async () => {
        try {
            // Sadece id'si olan alanlar silinebilir
            if (!field.id) {
                message.warning('Bu alan henüz kaydedilmedi, sadece kaldırıldı.');
                onDeleteField(field); // Sadece local state'den kaldır
                return;
            }

            await axios.delete(`/api/template-fields/${field.id}`);
            message.success('Alan başarıyla silindi.');
            onDeleteField(field);
        } catch (error) {
            console.error('Error deleting field:', error);
            message.error('Alan silinirken bir hata oluştu.');
        }
    };

    return (
        <div className='field-editor-modal-container'>
            <Input
                className='field-editor__field-names-input'
                placeholder='Model alanı için isim giriniz'
                value={field.fieldName}
                onChange={(e) => handleFieldNameChange(e.target.value)}
                status={field.fieldName.trim() === '' ? 'error' : ''} 
            />
            <Select
                className='field-editor__field-types-select'
                defaultValue={field.fieldType}
                onChange={handleFieldTypeChange}
                placeholder="Alan türünü seçiniz"
                options={[
                    { value: "STRING", label: "Metin (String)" },
                    { value: "INTEGER", label: "Tam Sayı (Integer)" },
                    { value: "FLOAT", label: "Ondalık Sayı (Float)" },
                    { value: "BOOLEAN", label: "Doğru/Yanlış (Boolean)" },
                    { value: "DATE", label: "Tarih" }
                ]}
            />
            <Tooltip title="Bu alanın doldurulması zorunludur">
                <Checkbox
                    className='field-editor__is-required-checkbox'
                    checked={Boolean(field.isRequired)}
                    onChange={(e) => handleIsRequiredChange(e.target.checked)}
                />
            </Tooltip>
            <Button
                className='field-editor-delete-field-icon'
                onClick={deleteField}
                danger
            >
                <DeleteFilled />
            </Button>
        </div>
    );
};

export default FieldEditor;
