# Mobile Menu Component

## Overview
The MobileMenu component is a responsive navigation solution that replaces the horizontal navigation bar on mobile devices. It uses a Sheet component to display a collapsible menu with the same navigation items as the desktop version.

## Features
- Responsive design that activates on screens smaller than 768px
- Hamburger menu icon that triggers the mobile menu
- Complete navigation functionality matching desktop menu
- Loading state support during authentication
- Proper accessibility attributes

## Implementation Details
- Uses the existing `useIsMobile` hook to detect screen size
- Leverages the Sheet UI component for the mobile menu
- Maintains all original navigation links and functionality
- Preserves user authentication state handling

## Usage
The MobileMenu is automatically used in the Navbar component when the screen size is detected as mobile. No additional setup is required.

## Design Considerations
- The menu slides in from the left for intuitive mobile navigation
- Proper spacing and touch targets for mobile usability
- Consistent styling with the overall application design
- Smooth animations for better user experience# Mobile Menu Component

## Overview
The MobileMenu component is a responsive navigation solution that replaces the horizontal navigation bar on mobile devices. It uses a Sheet component to display a collapsible menu with the same navigation items as the desktop version.

## Features
- Responsive design that activates on screens smaller than 768px
- Hamburger menu icon that triggers the mobile menu
- Complete navigation functionality matching desktop menu
- Loading state support during authentication
- Proper accessibility attributes

## Implementation Details
- Uses the existing `useIsMobile` hook to detect screen size
- Leverages the Sheet UI component for the mobile menu
- Maintains all original navigation links and functionality
- Preserves user authentication state handling

## Usage
The MobileMenu is automatically used in the Navbar component when the screen size is detected as mobile. No additional setup is required.

## Design Considerations
- The menu slides in from the left for intuitive mobile navigation
- Proper spacing and touch targets for mobile usability
- Consistent styling with the overall application design
- Smooth animations for better user experience