import React from 'react';
import './CuratedOfferCard.css';
import Image from 'next/image';
import logo from '@/public/stores/amazon.webp';
import featuredImage from '@/public/store-covers/amazon.jpg'

const CuratedOfferCard = () => {

  return (
    <a className='co-card'>
        <div className='co-card_content'>
            <Image className='co-card_logo' src={logo}/>
            <p className='co-card_text'>Get 30% Off your purchase from Amazon</p>
            <p className='co-card_cta'>SHOP NOW</p>
        </div>
        <Image src={featuredImage} width={160} height={160} alt='featured image' className='co-card_image'/>
    </a>
  )
}

export default CuratedOfferCard