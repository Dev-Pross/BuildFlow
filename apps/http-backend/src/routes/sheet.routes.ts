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
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User isnot logged in /not authorized" });
      const credentialId = req.params.cred;
      if (!credentialId) {
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
        credentialId: credentialId,
        authType: 'gsheet_oauth'
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
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User isnot logged in /not authorized" });
      const credentialId = req.params.cred;
      const sheetId = req.params.sheetId;
      if (!credentialId || !sheetId) {
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
        { userId: userId, credentialId: credentialId, authType: 'gsheet_oauth' },
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

sheetRouter.get(
  "/getHeaders/:cred/:sheetId/:sheetName",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId)
        return res.status(statusCodes.UNAUTHORIZED).json({
          message: "User not authorized"
        })

      const { cred: credentialId, sheetId, sheetName } = req.params;

      if (!credentialId || !sheetId || !sheetName) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Missing required parameters"
        })
      }

      const result = await sheetExecutor.getHeaderRow({
        userId, credentialId, authType: 'gsheet_oauth'
      }, sheetId, sheetName
      )

      if (!result.success)
        return res.status(statusCodes.NOT_FOUND).json({
          message: "Failed to fetch headers", error: result
        });

      return res.status(statusCodes.OK).json({
        message: "Headers fetched successfully",
        headers: result.output
      });
    }
    catch (e) {
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Error fetching sheet headers",
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }
)
