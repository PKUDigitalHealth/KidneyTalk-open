import React, { useState, useEffect } from 'react';
import { Button } from '@janhq/joi';
import { MoreHorizontalIcon, FileTextIcon, FileTypeIcon, FileIcon } from 'lucide-react';
import { KnowledgeFileRecord } from '@/utils/file';
import { ContextMenu } from './ContextMenu';
import { LEFT_PANEL_WIDTH } from '@/containers/LeftPanelContainer';

interface FileItemProps {
    file: KnowledgeFileRecord;
    onSelect: (file: KnowledgeFileRecord) => void;
    onContextMenu: (file: KnowledgeFileRecord | null) => void;
    isContextMenuVisible: boolean;
    onDelete: (file: KnowledgeFileRecord) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
    file,
    onSelect,
    onContextMenu,
    isContextMenuVisible,
    onDelete
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [truncatedName, setTruncatedName] = useState(file.name);

    // 动态计算文件名显示长度
    const calculateTruncatedName = () => {
        const leftPanelWidth = Number(localStorage.getItem(LEFT_PANEL_WIDTH)) || 200;
        
        const minWidth = 200;
        const maxWidth = 500;
        const minChars = 10;
        
        // 移除文件扩展名
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const maxChars = nameWithoutExt.length;
        
        const iconWidth = 24;
        const moreButtonWidth = 32;
        const padding = 16;
        const availableWidth = leftPanelWidth - iconWidth - moreButtonWidth - padding;
        
        const estimatedChars = Math.floor(availableWidth / 8);
        
        let displayLength = Math.floor(
            minChars + 
            ((leftPanelWidth - minWidth) / (maxWidth - minWidth)) * (maxChars - minChars)
        );
        displayLength = Math.min(displayLength, estimatedChars);
        displayLength = Math.max(minChars, Math.min(maxChars, displayLength));
        
        if (nameWithoutExt.length <= displayLength) {
            return nameWithoutExt;
        }
        
        return `${nameWithoutExt.slice(0, displayLength - 3)}...`;
    };

    useEffect(() => {
        const handleResize = () => {
            setTruncatedName(calculateTruncatedName());
        };

        handleResize(); // 初始计算
        
        // 监听 resize 事件
        window.addEventListener('resize', handleResize);
        
        // 使用定时器定期检查宽度变化
        const intervalId = setInterval(handleResize, 100);
        
        // 监听鼠标移动事件（用于拖动时实时更新）
        const handleMouseMove = () => {
            requestAnimationFrame(handleResize);
        };
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(intervalId);
        };
    }, [file.name]); // 当文件名改变时重新计算

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileTextIcon size={16} className="mr-2" />;
            case 'md':
                return <FileTypeIcon size={16} className="mr-2" />;
            default:
                return <FileIcon size={16} className="mr-2 text-gray-500" />;
        }
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
        onContextMenu(file);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        onContextMenu(null);
    };

    return (
        <div
            className="w-full group flex justify-between items-center p-2 rounded-lg hover:bg-[hsla(var(--left-panel-menu-hover))]"
            onClick={() => onSelect(file)}
        >
            <span className='flex-1 overflow-hidden text-ellipsis whitespace-nowrap flex items-center'>
                {getFileIcon(file.name)}
                {truncatedName}
            </span>
            <div 
                className="relative group-hover:visible invisible flex-shrink-0"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <Button theme='icon'>
                    <MoreHorizontalIcon className="cursor-pointer" />
                </Button>
                <ContextMenu
                    file={file}
                    isVisible={isContextMenuVisible}
                    onDelete={onDelete}
                />
            </div>
        </div>
    );
}; 
