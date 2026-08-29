const verificationRequirements = {
  expert: {
    required: [
      "national_id",
      "professional_certificate"
    ],

    optional: [
      "academic_certificate",
      "professional_license",
      "additional_document"
    ]
  },

  supplier: {
    required: [
      "national_id",
      "business_registration",
      "business_permit"
    ],

    optional: [
      "tax_document",
      "sector_license",
      "additional_document"
    ]
  }
};

module.exports = verificationRequirements;