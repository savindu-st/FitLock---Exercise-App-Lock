import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchases, CustomerInfo } from '@revenuecat/purchases-capacitor';

interface SubscriptionContextType {
    isPremium: boolean;
    customerInfo: CustomerInfo | null;
    isLoading: boolean;
    refreshInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    isPremium: false,
    customerInfo: null,
    isLoading: true,
    refreshInfo: async () => { },
});

export const useSubscription = () => useContext(SubscriptionContext);

const ENTITLEMENT_ID = 'FitLock Pro';

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // const checkPremium = (info: CustomerInfo) => {
    //     return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    // };

    const refreshInfo = async () => {
        // try {
        //     const info = await Purchases.getCustomerInfo();
        //     setCustomerInfo(info.customerInfo);
        // } catch (e) {
        //     console.error('Failed to get customer info', e);
        // } finally {
        //     setIsLoading(false);
        // }
        setIsLoading(false);
    };

    useEffect(() => {
        refreshInfo();

        // let listenerId: string | null = null;
        // const setupListener = async () => {
        //     listenerId = await Purchases.addCustomerInfoUpdateListener((info) => {
        //         setCustomerInfo(info);
        //     });
        // };
        // setupListener();

        // return () => {
        //     if (listenerId) Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId });
        // };
    }, []);

    // const isPremium = customerInfo ? checkPremium(customerInfo) : false;
    const isPremium = false; // Always false for the initial ad-supported release

    return (
        <SubscriptionContext.Provider value={{ isPremium, customerInfo, isLoading, refreshInfo }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
