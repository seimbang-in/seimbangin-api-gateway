import { createResponse } from "../utils/response";
import { Request, Response } from "express";

const ocrController = {
  post: async (req: Request, res: Response) => {
    // get image data
    const photo = req.file;

    if (!photo) {
      createResponse.error({
        status: 400,
        res,
        message: "Please upload a file",
      });
      return;
    }

    const getOCR = (image: Express.Multer.File) => {
      console.log(image);

      return {
        resultCode: 200,
        message: "Success",
        data: {
          products: [
            {
              name: "GRNIER M.COOLFOAM50",
              price: 39800,
              quantity: 1,
              category: "others",
            },
            {
              name: "PLASTIK KCL",
              price: 10000,
              quantity: 1,
              category: "others",
            },
          ],
          discount: null,
          total: 49800,
        },
      };
    };

    const mockData = getOCR(photo).data;

    setTimeout(() => {
      createResponse.success({
        res,
        message: `OCR process success, photo file : ${photo.originalname}`,
        data: mockData,
      });
    }, 1000);
  },
};

export default ocrController;
