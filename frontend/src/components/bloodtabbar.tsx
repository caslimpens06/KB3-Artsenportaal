import React from 'react';

interface BloodTabBarProps {
  tabs: string[];
  selectedTab: string;
  onTabClick: (tab: string) => void;
  tabGroupName: string;
}

const BloodTabBar: React.FC<BloodTabBarProps> = ({
  tabs,
  selectedTab,
  onTabClick,
  tabGroupName,
}) => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#E8F2FF',
      borderRadius: '8px',
      border: '2px solid #c4c4f7',
      display: 'flex',
      justifyContent: 'space-around',
      marginBottom: '20px',
    }}>
      {tabs.map((tab) => (
        <div
          key={tab}
          role="tab"
          aria-selected={selectedTab === tab}
          aria-controls={`${tabGroupName}-${tab}-panel`}
          tabIndex={selectedTab === tab ? 0 : -1}
          onClick={() => onTabClick(tab)}
          style={{
            cursor: 'pointer',
            fontWeight: selectedTab === tab ? 'bold' : 'normal',
            color: selectedTab === tab ? '#000369' : 'black',
            borderBottom: selectedTab === tab ? '2px solid #000369' : 'none',
            paddingBottom: '5px',
          }}
        >
          {tab}
        </div>
      ))}
    </div>
  );
};

export default BloodTabBar;
