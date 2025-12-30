import { Response, Router } from "express";
import { AuthRequest, userMiddleware } from "./userRoutes/userMiddleware.js";
import { statusCodes } from "@repo/common/zod";
import { GoogleSheetsNodeExecutor } from "@repo/nodes";

export const sheetRouter: Router = Router();
const sheetExecutor = new GoogleSheetsNodeExecutor();

sheetRouter.get(
  "/getDocuments/:cred",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.BAD_GATEWAY)
          .json({ message: "User isnot logged in /not authorized" });
      const credId = req.params.cred;
      if (!credId) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: "credentials id not provided" });
      }
      const userId = req.user.sub;
      console.log("userid from node route: ", userId);
      if (!userId)
        return res
          .status(statusCodes.NOT_FOUND)
          .json({ message: "User id not provided" });
      const sheets = await sheetExecutor.getSheets({
        userId: userId,
        credId: credId,
      });
      if ((sheets as any)?.success === false) {
        return res.status(statusCodes.NOT_FOUND).json({
          message: "files not found",
          files: sheets,
        });
      }
      return res.status(statusCodes.OK).json({
        message: "sheets are fetched successfully",
        files: (sheets as any)?.data?.data?.files || [],
      });
    } catch (e) {
      console.log(
        "Error Fetching the credentials ",
        e instanceof Error ? e.message : "Unkown reason"
      );
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server from fetching the credentials" });
    }
  }
);

sheetRouter.get(
  "/getSheets/:cred/:sheetId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId)
        return res
          .status(statusCodes.BAD_GATEWAY)
          .json({ message: "User isnot logged in /not authorized" });
      const credId = req.params.cred;
      const sheetId = req.params.sheetId;
      if (!credId || !sheetId) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: `credentials id not provided ` });
      }
      if (!sheetExecutor) {
        return res.status(statusCodes.FORBIDDEN).json({
          message: "sheet executor not configured well",
        });
      }
      const sheets = await sheetExecutor.getSheetTabs(
        { userId: userId, credId: credId },
        sheetId
      );

      if ((sheets as any)?.success === false)
        return res.status(statusCodes.NOT_FOUND).json({
          message: "files not found",
          files: sheets,
        });

      return res.status(statusCodes.OK).json({
        message: "sheets are fetched successfully",
        files: sheets,
      });
    } catch (e) {
      console.log(
        "Error Fetching the credentials ",
        e instanceof Error ? e.message : "Unkown reason"
      );
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server from fetching the credentials" });
    }
  }
);
