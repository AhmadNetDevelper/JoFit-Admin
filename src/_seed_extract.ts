// Throwaway extraction script for demo-data seeding. Dumps admin mock fixtures to JSON
// so a separate Node seeding script (outside this repo) can POST them through the live API.
// Safe to delete after seeding; kept on disk per the seeding task's instructions.
import { mockPeople } from "@/mocks/people/index";
import { buildCustomers } from "@/mocks/customers/index";
import { mockOrders } from "@/mocks/orders/index";
import { mockCoachBookings, mockSpecialisations as adminSpecialisations } from "@/mocks/coaches/index";
import { mockEnrolments } from "@/mocks/education/index";
import { mockRentalBookings } from "@/mocks/rental/index";
import { mockCommunityPosts, mockCommunityComments } from "@/mocks/community/index";
import { mockReviews } from "@/mocks/reviews/index";
import { mockQuotationRequests } from "@/mocks/quotations/index";
import { mockMenus, mockMenuPages } from "@/mocks/menus/index";
import {
  mockCountries,
  mockCities,
  mockAcademicDegrees,
  mockJobStatuses,
  mockJobTypes,
  mockUniversityMajors,
  mockUserJobTypes,
} from "@/mocks/lookups/index";

const out = {
  people: mockPeople,
  customers: buildCustomers(),
  orders: mockOrders,
  coachBookings: mockCoachBookings,
  adminSpecialisations,
  enrolments: mockEnrolments,
  rentalBookings: mockRentalBookings,
  communityPosts: mockCommunityPosts,
  communityComments: mockCommunityComments,
  reviews: mockReviews,
  quotationRequests: mockQuotationRequests,
  menus: mockMenus,
  menuPages: mockMenuPages,
  lookups: {
    countries: mockCountries,
    cities: mockCities,
    academicDegrees: mockAcademicDegrees,
    jobStatuses: mockJobStatuses,
    jobTypes: mockJobTypes,
    universityMajors: mockUniversityMajors,
    userJobTypes: mockUserJobTypes,
  },
};

console.log(JSON.stringify(out));
